import { useState, useEffect } from 'react';
import { matchZipcode, getMyPoints, getMyActiveCoupons, applyCoupon } from '../api';
import API from '../api';
import { useStore } from '../StoreContext';
import { getItemPrice } from '../utils/pricing';

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
  const { currentStore } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [showAddress, setShowAddress] = useState(false);
  const [useDefaultAddress, setUseDefaultAddress] = useState(true);
  const [address, setAddress] = useState({ name: '', phone: '', address: '', detail: '' });
  const [zipcode, setZipcode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [matchingZipcode, setMatchingZipcode] = useState(false);
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
    setMatchingZipcode(true);
    try {
      const res = await matchZipcode(zip, dong);
      if (res.data.matched) {
        setDeliveryInfo({ zoneName: res.data.zone.zone_name, deliveryFee: res.data.delivery_fee });
      } else {
        setDeliveryInfo({ error: res.data.message || '배송 불가 지역이에요' });
      }
    } catch (err) {
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

  // 수동 입력 zip엔 저장된 동 이름을 붙이지 않음(저장 주소=우편번호 일치일 때만 동 매칭)
  const handleZipcodeCheck = () => checkZipcodeValue(zipcode, zipcode === user?.zipcode ? user?.dong_name : null);

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

  const baseDeliveryFeeRule = currentStore?.base_delivery_fee ?? 0;
  const freeDeliveryMin = currentStore?.free_delivery_min ?? 0;
  const extraDeliveryFee = deliveryInfo?.deliveryFee ?? 0;
  const baseFee = (freeDeliveryMin > 0 && totalPrice >= freeDeliveryMin) ? 0 : baseDeliveryFeeRule;
  const totalDeliveryFee = baseFee + extraDeliveryFee;

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
      alert(err.response?.data?.message || '쿠폰 적용 실패');
      setSelectedCouponId(''); setCouponDiscount(0);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput) { alert('쿠폰 코드를 입력해주세요!'); return; }
    try {
      const res = await API.post('/coupons/check', { code: couponInput.toUpperCase() });
      const coupon = res.data;
      if (coupon.min_order_amount > 0 && totalPrice < coupon.min_order_amount) {
        alert(`최소 주문금액 ₩${coupon.min_order_amount.toLocaleString()} 이상이어야 해요!`);
        return;
      }
      setAppliedCoupon(coupon);
      alert((coupon.description || coupon.code) + ' 쿠폰이 적용됐어요! 😊');
      setCouponInput('');
    } catch (err) {
      alert(err.response?.data?.error || '유효하지 않은 쿠폰 코드예요!');
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
    use_points: clampedUsePoints,
    coupon_id: selectedCouponId || null,
    coupon_discount: couponDiscount,
    baseDeliveryFee: baseFee,
    extraDeliveryFee,
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
    useDefaultAddress, address, setAddress, zipcode, setZipcode, setDeliveryInfo,
    deliveryInfo, matchingZipcode,
    defaultAddress, hasDefaultAddress, currentAddress, isAddressComplete,
    handleSwitchAddress, handleZipcodeCheck, checkZipcodeValue,
    // 쿠폰
    couponInput, setCouponInput, appliedCoupon, handleApplyCoupon, handleRemoveCoupon,
    myCoupons, selectedCouponId, couponDiscount, handleCouponSelect,
    // 포인트
    myPoints, usePoints, setUsePoints, clampedUsePoints,
    // 금액
    totalPrice, discountAmount, baseFee, freeDeliveryMin, extraDeliveryFee, totalDeliveryFee, finalPrice,
    // 결제
    canPay, buildOrderExtras,
  };
}
