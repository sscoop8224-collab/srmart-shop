import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { matchZipcode, getMyPoints, getMyActiveCoupons, quoteOrder } from '../api';
import API from '../api';
import { getItemPrice } from '../utils/pricing';
import { useDialog } from '../DialogContext';
import { useStore } from '../StoreContext';

// 장바구니 주문서(orderSheet)와 바로 주문(quickOrder)이 공유하는 결제 준비 로직.
//   - 배송지 자동채움(회원 기본주소) + 우편번호 → 배송권역 확인
//   - 쿠폰(보유 쿠폰 하나 또는 코드 하나) + 포인트 사용
//   - 🔴 금액은 **서버 견적**(POST /api/shop/quote)이 낸다 — 상품 금액(행사 전) · 행사 할인 · 쿠폰 할인 · 배송비 · 포인트 전 결제 금액
//   - POST /orders 에 보낼 orderExtras 페이로드 구성(buildOrderExtras)
//
// 🔴 왜 견적인가 (2026-11-13 대표님 지시 2) — 예전엔 화면이 단가 × 수량으로 직접 더했다(getItemPrice). 행사가 들어온 뒤로
//    서버(placeOrderInTx)는 행사 뒤 금액으로 결제를 다시 계산하므로, 행사가 걸린 장바구니는 **화면 금액 ≠ 서버 금액**이 되어
//    결제가 409 「결제 금액이 맞지 않아요」로 막혔다. 쿠폰 율·무료배송 기준도 행사 뒤 금액을 본다.
//    이제 견적과 주문이 **같은 줄(orderLinesOf)** 을 받고 같은 함수로 계산한다. 화면은 견적 값을 그대로 보이고 그대로 싣는다.
//    장바구니 = 주문서 = 실제 주문 금액은 백엔드 tools/check-shop-amount-parity.cjs --live 가 1원 단위로 맞춰 본다.
//
// items: 카트형 아이템 배열([{id,name,price,quantity,grams,pricing_type,purchase_type,...}])
//        주문서는 서버 장바구니의 살 수 있는 줄(useShopCart.orderItems), 바로 주문은 상품 1개짜리 배열.

/** 주문 줄 — 견적과 주문 입구가 **같은 배열**을 받는다(다르면 두 금액이 갈라진다). 가격은 싣지 않는다(서버가 정한다). */
export function orderLinesOf(items) {
  return (items || []).map(item => ({
    id: item.id,
    name: item.name,
    quantity: item.pricing_type === 'weight' ? 1 : item.quantity,
    grams: item.pricing_type === 'weight' ? (item.grams || 100) : undefined,
    quantity_type: item.purchase_type === 'box' ? 'box' : 'unit',
  }));
}

const QUOTE_DELAY_MS = 250;   // 포인트·쿠폰을 연달아 바꿀 때 견적을 몰아서 한 번

export function useCheckoutFlow(items, { user } = {}) {
  const { notify } = useDialog();
  const { currentStoreId, isOwner } = useStore();
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
  // 🔴 쿠폰·포인트를 못 불러왔을 때 **손님에게 보여 줄 말**. 빈 문자열이면 정상.
  const [benefitsError, setBenefitsError] = useState('');
  const [benefitsLoading, setBenefitsLoading] = useState(false);

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
      const res = await matchZipcode(zip, dong, isOwner ? currentStoreId : undefined);
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

  // ── 🔴 보유 쿠폰·포인트 — **못 불러왔으면 손님에게 말한다** (2026-10-22 지시 3) ──
  //
  // 예전엔 이랬다:
  //
  //     getMyPoints().then(...).catch(() => {});
  //     getMyActiveCoupons().then(...).catch(() => {});
  //
  // 🔴 `/api/users/me/coupons` 가 **4개월째 500** 이었는데 아무 데도 안 보였다.
  //    쿠폰 칸은 `myCoupons.length > 0` 일 때만 그려지므로(SummaryBar), 실패하면
  //    **칸 자체가 조용히 사라진다** — 손님은 쿠폰이 없는 줄 알고 그냥 결제한다.
  //    즉 이 빈 catch 가 손님에게 **돈을 더 내게 했다.**
  //
  // 그래서 실패를 상태로 남기고, 결제 요약에 한 줄로 띄우고, **다시 시도**를 준다.
  //   · 결제 자체를 막지는 않는다 — 손님이 지금 사고 싶을 수 있다
  //   · 다만 **할인이 빠진다는 사실**을 반드시 말한다. 그게 이 경고의 목적이다
  const loadBenefits = useCallback(() => {
    if (!user) return;
    setBenefitsError('');
    setBenefitsLoading(true);
    Promise.allSettled([getMyPoints(), getMyActiveCoupons()]).then(([pt, cp]) => {
      setBenefitsLoading(false);
      if (pt.status === 'fulfilled') setMyPoints(pt.value.data?.points || 0);
      if (cp.status === 'fulfilled') setMyCoupons((cp.value.data || []).filter(c => !c.used_at));
      const failed = [];
      if (pt.status === 'rejected') failed.push('포인트');
      if (cp.status === 'rejected') failed.push('쿠폰');
      if (!failed.length) return;
      const e = (pt.status === 'rejected' ? pt.reason : cp.reason);
      // 🔴 이유를 가른다 — "잠시 뒤 다시" 와 "우리 쪽 문제" 는 손님이 할 일이 다르다.
      const why = !e?.response ? '인터넷 연결을 확인해주세요'
        : e.response.status === 401 ? '다시 로그인해주세요'
        : e.response.status >= 500 ? '잠시 뒤 다시 시도해주세요 (서버 문제예요)'
        : (e.response.data?.error || '잠시 뒤 다시 시도해주세요');
      setBenefitsError(`보유 ${failed.join('·')}을 불러오지 못했어요 — ${why}.`
        + ' 지금 결제하면 할인이 빠진 금액으로 결제돼요.');
    });
  }, [user]);

  useEffect(() => { loadBenefits(); }, [loadBenefits]);

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

  // ── 🔴 서버 견적 ─────────────────────────────────────────────
  // 견적에 싣는 것 = 주문에 싣는 것(같은 줄 · 같은 쿠폰 · 같은 배송지). 하나라도 바뀌면 다시 묻고, 답이 올 때까지 결제 단추를 잠근다.
  const lines = useMemo(() => orderLinesOf(items), [items]);
  const quoteBody = useMemo(() => ({
    items: lines,
    coupon_id: selectedCouponId || null,
    coupon_code: appliedCoupon ? appliedCoupon.code : null,
    dong: matchedDong || undefined,
    zipcode: zipcode || undefined,
    // owner 매장 미리보기 — 서버가 role===owner 일 때만 반영(주문 입구와 같다) · 로그인 안 한 화면은 고른 매장
    store_id: isOwner || !user ? currentStoreId : undefined,
  }), [lines, selectedCouponId, appliedCoupon, matchedDong, zipcode, isOwner, user, currentStoreId]);
  const quoteKey = JSON.stringify(quoteBody);
  const [quote, setQuote] = useState(null);          // { key, data } — 마지막으로 받은 견적과 그 질문
  const [quoteError, setQuoteError] = useState('');
  const quoteSeq = useRef(0);

  useEffect(() => {
    if (!lines.length) { setQuote(null); return undefined; }
    const my = ++quoteSeq.current;
    setQuoteError('');
    const t = setTimeout(async () => {
      try {
        const r = await quoteOrder(quoteBody);
        if (my === quoteSeq.current) setQuote({ key: quoteKey, data: r.data });
      } catch (e) {
        if (my !== quoteSeq.current) return;
        if (e.response?.data?.code === 'COUPON_ONE_ONLY') { setAppliedCoupon(null); notify(e.response.data.error); return; }
        setQuoteError(e.response?.data?.error || '금액을 확인하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.');
      }
    }, QUOTE_DELAY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteKey]);

  const q = quote ? quote.data : null;
  const quoteFresh = !!quote && quote.key === quoteKey;

  // 쿠폰이 서버 판정에서 막히면(최소 금액·기한·한도 등) 이유를 말하고 뺀다 — 뺀 채 다시 견적을 받는다
  useEffect(() => {
    if (!quoteFresh || !q?.coupon_error) return;
    notify(q.coupon_error);
    setSelectedCouponId(''); setAppliedCoupon(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteFresh, q?.coupon_error]);

  // 견적 전(처음 몇백 ms)에만 줄 정가 합으로 자리를 채운다 — 결제 단추는 견적이 올 때까지 잠겨 있다
  const totalPrice = q ? q.gross : items.reduce((sum, item) => sum + getItemPrice(item), 0);   // 상품 금액(행사 전)
  const promoDiscount = q ? q.promo_discount : 0;                                               // 행사 할인
  const couponTotal = q ? q.coupon_discount : 0;
  const discountAmount = appliedCoupon ? couponTotal : 0;      // 코드 쿠폰 할인
  const couponDiscount = selectedCouponId ? couponTotal : 0;   // 보유 쿠폰 할인
  const totalDeliveryFee = q ? q.delivery_fee : (deliveryInfo?.deliveryFee ?? 0);
  const freeDeliveryMin = q ? q.free_delivery_min : (deliveryInfo?.freeDeliveryMin ?? 0);
  const finalBeforePoints = q ? q.final_before_points : Math.max(0, totalPrice + totalDeliveryFee);
  const clampedUsePoints = Math.min(usePoints, myPoints, finalBeforePoints);
  const finalPrice = Math.max(0, finalBeforePoints - clampedUsePoints);   // 서버 serverFinal 과 같은 식(포인트를 뺀다)
  const quoteProblems = q ? q.lines.filter(l => !l.ok).map(l => l.error) : [];

  // 쿠폰은 주문당 한 장(2026-11-13 결정 5) — 하나를 고르면 다른 하나를 뺀다. 할인 금액은 견적이 낸다.
  const handleCouponSelect = async (couponId) => {
    setSelectedCouponId(couponId);
    if (couponId) setAppliedCoupon(null);
  };

  const handleApplyCoupon = async () => {
    if (!couponInput) { notify('쿠폰 코드를 입력해주세요!'); return; }
    try {
      const res = await API.post('/coupons/check', { code: couponInput.toUpperCase() });
      const coupon = res.data;
      // 최소 금액·기한·한도는 견적(서버)이 행사 뒤 금액으로 판정한다 — 막히면 위 effect 가 이유를 말하고 뺀다
      setAppliedCoupon(coupon);
      setSelectedCouponId('');
      notify((coupon.description || coupon.code) + ' 쿠폰이 적용됐어요! 😊');
      setCouponInput('');
    } catch (err) {
      notify(err.response?.data?.error || '유효하지 않은 쿠폰 코드예요!');
    }
  };

  const handleRemoveCoupon = () => { setAppliedCoupon(null); setCouponInput(''); };

  const currentAddress = useDefaultAddress ? defaultAddress : address;
  const isAddressComplete = !!(currentAddress.name && currentAddress.phone && currentAddress.address);
  const quoteReady = quoteFresh && !quoteError && quoteProblems.length === 0 && !q.out_of_zone && !q.coupon_error;
  const canPay = isAddressComplete && !!zipcode && !!deliveryInfo?.zoneName && !matchingZipcode && quoteReady;

  // 결제 버튼 onClick 에서 그대로 onPayment(finalPrice, orderExtras) 에 넘길 페이로드.
  // 🔴 items · coupon · dong · zipcode 는 **방금 견적에 실은 그 값**이다(quoteBody) — 따로 만들면 두 금액이 갈라진다.
  const buildOrderExtras = () => ({
    zipcode,
    dong: matchedDong,   // 서버가 zone 을 직접 재조회할 때 씀(배송비 숫자는 이제 안 보냄 — 서버가 재계산)
    // owner 매장 미리보기 전용 — 서버가 role===owner일 때만 이 값을 실제로 반영하고
    // is_test_order=1을 자동으로 붙인다(POST /api/orders). 일반 회원은 서버가 무시.
    store_id: isOwner ? currentStoreId : undefined,
    use_points: clampedUsePoints,
    coupon_id: quoteBody.coupon_id,
    coupon_code: quoteBody.coupon_code,
    address: currentAddress.address,
    addressDetail: currentAddress.detail,
    receiverName: currentAddress.name,
    receiverPhone: currentAddress.phone,
    items: quoteBody.items,
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
    // 🔴 쿠폰·포인트를 못 불러왔다는 사실 — 화면이 반드시 띄운다
    benefitsError, benefitsLoading, retryBenefits: loadBenefits,
    // 포인트
    myPoints, usePoints, setUsePoints, clampedUsePoints,
    // 금액 — 전부 서버 견적. totalPrice = 상품 금액(행사 전) · promoDiscount = 행사 할인 · deliveryFee = 최종 배송비
    totalPrice, promoDiscount, discountAmount, deliveryFee: totalDeliveryFee, freeDeliveryMin, totalDeliveryFee, finalBeforePoints, finalPrice,
    // 견적 상태 — 화면이 「금액 확인 중」·오류·살 수 없는 줄을 말한다
    quoteLoading: !!lines.length && !quoteFresh && !quoteError, quoteError, quoteProblems,
    // 결제
    canPay, buildOrderExtras,
  };
}
