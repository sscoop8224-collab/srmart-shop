// 하단 고정 결제 요약(상품금액/할인/배송비/보유쿠폰/포인트/총결제금액/결제버튼).
// Cart.js 원본(400~493행)에서 그대로 옮김 — 마크업/스타일/문구/버튼 활성화조건 동일.
// props 는 useCheckoutFlow() 의 반환값을 그대로 펼쳐서 넘기면 된다. onPay 만 호출부(Cart/QuickOrder)가 넘긴다.
function SummaryBar({
  darkMode,
  totalPrice, appliedCoupon, discountAmount,
  deliveryFee, freeDeliveryMin,
  myCoupons, selectedCouponId, handleCouponSelect, couponDiscount,
  myPoints, usePoints, setUsePoints, clampedUsePoints,
  finalPrice, canPay, zipcode, deliveryInfo,
  onPay,
  payLabel = '카카오페이로 결제하기 💳',
}) {
  const borderColor = darkMode ? '#2e2e2e' : '#f0faf5';
  const textColor = darkMode ? '#f0f0f0' : '#1a1a1a';
  const subTextColor = darkMode ? '#9e9e9e' : '#adb5bd';
  const inputBg = darkMode ? '#2e2e2e' : '#f8fffe';
  const inputBorder = darkMode ? '#3a3a3a' : '#e8faf3';
  const fixedBg = darkMode ? '#1a1a1a' : 'white';

  return (
    <div className="cart-checkout" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: fixedBg, padding: '16px 20px 36px', borderTop: `1px solid ${borderColor}`, boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', color: subTextColor }}>상품 금액</span>
        <span style={{ fontSize: '13px', color: textColor, fontWeight: '600' }}>₩{totalPrice.toLocaleString()}</span>
      </div>
      {appliedCoupon && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '13px', color: '#00a85e' }}>쿠폰 할인</span>
          <span style={{ fontSize: '13px', color: '#00a85e', fontWeight: '700' }}>-₩{discountAmount.toLocaleString()}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', color: subTextColor }}>
          배송비
          {freeDeliveryMin > 0 && deliveryFee === 0 && <span style={{ color: '#00a85e', marginLeft: 6, fontWeight: 700 }}>무료배송 적용</span>}
        </span>
        <span style={{ fontSize: '13px', color: textColor, fontWeight: '600' }}>₩{deliveryFee.toLocaleString()}</span>
      </div>
      {/* 보유 쿠폰 선택 */}
      {myCoupons.length > 0 && (
        <div style={{ marginBottom: '12px', padding: '12px 14px', background: darkMode ? '#2a1a10' : '#fff8f0', borderRadius: 12, border: `1px solid ${darkMode ? '#3a2a20' : '#ffe0b2'}` }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#e65100', marginBottom: 8 }}>보유 쿠폰 ({myCoupons.length}장)</div>
          <select value={selectedCouponId} onChange={e => handleCouponSelect(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid #ffb74d', fontSize: '13px', outline: 'none', background: darkMode ? '#2e2e2e' : 'white', color: darkMode ? '#f0f0f0' : '#1a1a1a', fontFamily: 'inherit' }}>
            <option value="">쿠폰 선택 안함</option>
            {myCoupons.map(c => (
              <option key={c.id} value={c.coupon_id || c.id}>
                {c.coupon_name} — {c.discount_type === 'percent' ? `${c.discount}%` : `₩${Number(c.discount).toLocaleString()}`} 할인
              </option>
            ))}
          </select>
          {couponDiscount > 0 && <div style={{ fontSize: '12px', color: '#e65100', marginTop: 6, fontWeight: 600 }}>−₩{couponDiscount.toLocaleString()} 쿠폰 할인 적용</div>}
        </div>
      )}
      {/* 포인트 사용 */}
      {myPoints > 0 && (
        <div style={{ marginBottom: '12px', padding: '12px 14px', background: darkMode ? '#1a2030' : '#f0f6ff', borderRadius: 12, border: `1px solid ${darkMode ? '#2a3040' : '#d0e4ff'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1a73e8' }}>포인트 사용</span>
            <span style={{ fontSize: '12px', color: darkMode ? '#8ab4f8' : '#1a73e8' }}>보유 {myPoints.toLocaleString()}P</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input type="number" value={usePoints || ''}
              onChange={e => setUsePoints(Math.min(Number(e.target.value) || 0, myPoints))}
              placeholder="사용할 포인트 입력"
              min="0" max={myPoints}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${inputBorder}`, fontSize: '13px', outline: 'none', background: inputBg, color: textColor, fontFamily: 'inherit' }} />
            <button onClick={() => setUsePoints(Math.min(myPoints, totalPrice - discountAmount + deliveryFee))}
              style={{ padding: '8px 12px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: 8, fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>전액</button>
            <button onClick={() => setUsePoints(0)}
              style={{ padding: '8px 10px', background: darkMode ? '#2e2e2e' : '#e8e8e8', color: textColor, border: 'none', borderRadius: 8, fontSize: '12px', cursor: 'pointer' }}>취소</button>
          </div>
          {clampedUsePoints > 0 && <div style={{ fontSize: '12px', color: '#1a73e8', marginTop: 6, fontWeight: 600 }}>−{clampedUsePoints.toLocaleString()}P 적용</div>}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', paddingTop: '10px', borderTop: `1px solid ${borderColor}` }}>
        <span style={{ fontSize: '15px', fontWeight: '700', color: textColor }}>총 결제금액</span>
        <span style={{ fontSize: '22px', fontWeight: '900', color: '#00c471' }}>₩{finalPrice.toLocaleString()}</span>
      </div>
      <button
        disabled={!canPay}
        onClick={onPay}
        style={{ width: '100%', padding: '16px', background: !canPay ? '#dee2e6' : 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', cursor: !canPay ? 'not-allowed' : 'pointer', fontWeight: '800', boxShadow: !canPay ? 'none' : '0 4px 20px rgba(0,196,113,0.35)', letterSpacing: '-0.3px' }}>
        {!zipcode ? '주소를 검색해주세요' : !deliveryInfo?.zoneName ? '배송 구역을 확인해주세요' : payLabel}
      </button>
    </div>
  );
}

export default SummaryBar;
