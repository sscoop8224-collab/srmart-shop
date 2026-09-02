import { useState, useEffect } from 'react';
import { matchZipcode, getMyPoints, getMyActiveCoupons, applyCoupon } from '../api';
import API from '../api';
import { getItemPrice } from '../utils/pricing';
import { useDialog } from '../DialogContext';

// 장바구니(Cart.js)와 바로주문(QuickOrder.js)이 공유하는 결제 준비 로직.
//   - 배송지 자동채움(회원 기본주소) + 우편번호 → 배송권역 확인
//   - 쿠폰(코드 입력 + 보유쿠폰 선택) + 포인트 사용
//   - 상품금액/배송비/할인/포인트를 반영한 최종 결제금액 계산
//   - POST /orders 에 보낼 orderExtras 페이로드 구성(buildOrderExtras)
// 원본은 Cart.js 에 있던 로직을 그대로 옮긴 것 — 계산식·API 호출·에러 메시지 전부 동일.
//
// items: 카트형 아이템 배열([{id,name,price,quantity,grams,pricing_type,purchase_type,...}])
//        Cart 는 cart 배열 그대로, QuickOrder 는 상품 1개짜리 배열을 넘긴다.
// appliedCoupon(코드쿠폰)은 이 훅 안에서 독립적으로 관리 — Cart/QuickOrder 가 서로 다른
// 체크아웃 세션이므로 App 레벨에 둘 이유가 없다(기존엔 App.js 가 들고 Cart 에만 내려줬음).
export function useCheckoutFlow(items, { user } = {}) {
  const { notify } = useDialog();
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [showAddress, setShowAddress] = useState(false);
  const [useDefaultAddress, setUseDefaultAddress] = useState(true);
  const [address, setAddress] = useState({ name: '', phone: '', address: '', detail: '' });
  const [zipcode, setZipcode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [matchingZipcode, setMatchingZipcode] = useState(false);
  // 마지막으로 매칭을 시도한 동 이름 — 서버가 주문 생성 시 zone 을 직접 재조회하려면
  // 화면이 실제로 확인에 쓴 dong 값을 그대로 넘겨야 한다(클라 배송비 숫자는 더 이상 안 믿음).
  const [matchedDong, setMatchedDong] = useState('');
  const [myPoints, setMyPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(0);
  const [myCoupons, setMyCoupons] = useState([]);
  const [selectedCouponId, setSelectedCouponId] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);

  const defaultAddress = {
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    detail: user?.addressDetail || '',
  };
  const hasDefaultAddress = defaultAddress.address && defaultAddress.address.trim() !== '';

  const checkZipcodeValue = async (zip, dong) => {
    if (!zip || zip.length < 3) return;
    // 배송권역 매칭은 동(dong) 이름이 주 기준이고, 지금 등록된 권역들은 우편번호 범위가
    // 비어 있어 동 없이는 서버가 무조건 '매칭 안됨'을 반환한다. 이 상태에서 서버 응답을
    // 그대로 보여주면 "이 지역은 배송 안 함"처럼 오해를 준다 — 실제로는 "동을 몰라서
    // 확인을 못 한 것"이므로, 서버를 부르기 전에 원인이 다른 안내를 명확히 보여준다.
    if (!dong) {
      setMatchedDong('');
      setDeliveryInfo({ error: '동(주소) 정보를 확인할 수 없어요. 주소 찾기로 다시 검색해주세요.', noDong: true });
      return;
    }
    setMatchingZipcode(true);
    try {
      const res = await matchZipcode(zip, dong);
      if (res.data.matched) {
        setMatchedDong(dong);
        setDeliveryInfo({
          zoneName: res.data.zone.zone_name,
          deliveryFee: res.data.delivery_fee,
          freeDeliveryMin: res.data.zone.free_delivery_min ?? 0,
        });
      } else {
        setMatchedDong('');
        setDeliveryInfo({ error: res.data.message || '배송 불가 지역이에요' });
      }
    } catch (err) {
      setMatchedDong('');
      if (err.response?.status === 401) {
        setDeliveryInfo({ error: '로그인이 필요해요' });
      } else if (err.response?.status === 400) {
        setDeliveryInfo({ error: err.response.data.error });
      } else {
        setDeliveryInfo({ error: '주소 확인 중 오류가 발생했어요' });
      }
    } finally {
      setMatchingZipcode(false);
    }
  };

  useEffect(() => {
    if (hasDefaultAddress) {
      setAddress(defaultAddress);
      setUseDefaultAddress(true);
      if (user?.zipcode) {
        setZipcode(user.zipcode);
        checkZipcodeValue(user.zipcode, user?.dong_name);
      }
    } else {
      setUseDefaultAddress(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user) {
      getMyPoints().then(r => setMyPoints(r.data?.points || 0)).catch(() => {});
      getMyActiveCoupons().then(r => setMyCoupons((r.data || []).filter(c => !c.used_at))).catch(() => {});
    }
  }, [user]);

  const handleSwitchAddress = (useDefault) => {
    setUseDefaultAddress(useDefault);
    setZipcode('');
    setDeliveryInfo(null);
    if (useDefault) {
      setAddress(defaultAddress);
      if (user?.zipcode) {
        setZipcode(user.zipcode);
        checkZipcodeValue(user.zipcode, user?.dong_name);
      }
    } else {
      setAddress({ name: '', phone: '', address: '', detail: '' });
    }
  };

  const totalPrice = items.reduce((sum, item) => sum + getItemPrice(item), 0);

  const discountAmount = appliedCoupon
    ? appliedCoupon.type === 'percent'
      ? Math.floor(totalPrice * appliedCoupon.discount / 100)
      : appliedCoupon.discount
    : 0;

  // 배송비 = '동별 배송비 = 최종값' — /api/store/match-zipcode 가 이미 우선순위(권역 매칭 시
  // 그 권역값, 권역이 하나도 없는 지점만 점포 기본값 폴백)를 판단해 내려주므로 프론트는
  // deliveryInfo 값을 그대로 최종 배송비로 쓴다(점포 기본을 여기서 다시 더하지 않음).
  const freeDeliveryMin = deliveryInfo?.freeDeliveryMin ?? 0;
  const totalDeliveryFee = (freeDeliveryMin > 0 && totalPrice >= freeDeliveryMin) ? 0 : (deliveryInfo?.deliveryFee ?? 0);

  const baseAfterCoupon = Math.max(0, totalPrice - discountAmount + totalDeliveryFee - couponDiscount);
  const clampedUsePoints = Math.min(usePoints, myPoints, baseAfterCoupon);
  const finalPrice = Math.max(0, baseAfterCoupon - clampedUsePoints);

  const handleCouponSelect = async (couponId) => {
    setSelectedCouponId(couponId);
    if (!couponId) { setCouponDiscount(0); return; }
    const cp = myCoupons.find(c => String(c.coupon_id) === String(couponId) || String(c.id) === String(couponId));
    if (!cp) { setCouponDiscount(0); return; }
    try {
      const r = await applyCoupon({ code: cp.code, total_amount: totalPrice - discountAmount + totalDeliveryFee });
      setCouponDiscount(r.data.discount_amount || 0);
    } catch (err) {
      notify(err.response?.data?.message || '쿠폰 적용 실패');
      setSelectedCouponId(''); setCouponDiscount(0);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput) { notify('쿠폰 코드를 입력해주세요!'); return; }
    try {
      const res = await API.post('/coupons/check', { code: couponInput.toUpperCase() });
      const coupon = res.data;
      if (coupon.min_order_amount > 0 && totalPrice < coupon.min_order_amount) {
        notify(`최소 주문금액 ₩${coupon.min_order_amount.toLocaleString()} 이상이어야 해요!`);
        return;
      }
      setAppliedCoupon(coupon);
      notify((coupon.description || coupon.code) + ' 쿠폰이 적용됐어요! 😊');
      setCouponInput('');
    } catch (err) {
      notify(err.response?.data?.error || '유효하지 않은 쿠폰 코드예요!');
    }
  };

  const handleRemoveCoupon = () => { setAppliedCoupon(null); setCouponInput(''); };

  const currentAddress = useDefaultAddress ? defaultAddress : address;
  const isAddressComplete = !!(currentAddress.name && currentAddress.phone && currentAddress.address);
  const canPay = isAddressComplete && !!zipcode && !!deliveryInfo?.zoneName && !matchingZipcode;

  // 결제 버튼 onClick 에서 그대로 onPayment(finalPrice, orderExtras) 에 넘길 페이로드.
  // Cart/QuickOrder 양쪽이 이 함수 하나로 구성해 필드 누락·불일치를 막는다.
  const buildOrderExtras = () => ({
    zipcode,
    dong: matchedDong,   // 서버가 zone 을 직접 재조회할 때 씀(배송비 숫자는 이제 안 보냄 — 서버가 재계산)
    use_points: clampedUsePoints,
    coupon_id: selectedCouponId || null,
    coupon_discount: couponDiscount,
    address: currentAddress.address,
    addressDetail: currentAddress.detail,
    receiverName: currentAddress.name,
    receiverPhone: currentAddress.phone,
    items: items.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.pricing_type === 'weight' ? 1 : item.quantity,
      grams: item.pricing_type === 'weight' ? (item.grams || 100) : undefined,
      quantity_type: item.purchase_type === 'box' ? 'box' : 'unit',
      price: getItemPrice(item),
    })),
  });

  return {
    // 배송지
    showAddress, setShowAddress,
    useDefaultAddress, address, setAddress, zipcode, setZipcode,
    deliveryInfo, matchingZipcode,
    defaultAddress, hasDefaultAddress, currentAddress, isAddressComplete,
    handleSwitchAddress, checkZipcodeValue,
    // 쿠폰
    couponInput, setCouponInput, appliedCoupon, handleApplyCoupon, handleRemoveCoupon,
    myCoupons, selectedCouponId, couponDiscount, handleCouponSelect,
    // 포인트
    myPoints, usePoints, setUsePoints, clampedUsePoints,
    // 금액 — deliveryFee 는 단일 최종 배송비(권역 매칭 시 권역값, 아니면 점포 기본 폴백)
    totalPrice, discountAmount, deliveryFee: totalDeliveryFee, freeDeliveryMin, totalDeliveryFee, finalPrice,
    // 결제
    canPay, buildOrderExtras,
  };
}
