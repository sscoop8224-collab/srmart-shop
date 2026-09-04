// 하단 고정 결제 요약(상품금액/할인/배송비/보유쿠폰/포인트/총결제금액/결제버튼).
// Cart.js 원본(400~493행)에서 그대로 옮김 — 마크업/스타일/문구/버튼 활성화조건 동일.
// props 는 useCheckoutFlow() 의 반환값을 그대로 펼쳐서 넘기면 된다. onPay 만 호출부(Cart/QuickOrder)가 넘긴다.
import { useRef, useState } from 'react';
import usePublishBottomBarHeight from '../../hooks/usePublishBottomBarHeight';

function SummaryBar({
  darkMode,
  totalPrice, appliedCoupon, discountAmount,
  deliveryFee, freeDeliveryMin,
  myCoupons, selectedCouponId, handleCouponSelect, couponDiscount,
  myPoints, usePoints, setUsePoints, clampedUsePoints,
  finalPrice, canPay, zipcode, deliveryInfo,
  onPay,
  payLabel = '결제하기',
}) {
  const borderColor = darkMode ? '#2e2e2e' : 'var(--primary-light)';
  const textColor = darkMode ? '#f0f0f0' : '#1a1a1a';
  const subTextColor = darkMode ? '#9e9e9e' : '#adb5bd';
  const inputBg = darkMode ? '#2e2e2e' : 'var(--primary-light)';
  const inputBorder = darkMode ? '#3a3a3a' : 'var(--primary-light)';
  const fixedBg = darkMode ? '#1a1a1a' : 'white';
  const barRef = useRef(null);
  usePublishBottomBarHeight(barRef);
  // 포인트 사용 영역 기본 접힘 — 결제 요약이 상품목록을 너무 많이 잠식해서(쿠폰+포인트
  // 박스가 같이 펼쳐지면 100px+) 매번 입력하지 않는 사용자가 더 많은 포인트를 기본
  // 접어두고 필요할 때만 펼치게 함(2026-09-03).
  const [pointsExpanded, setPointsExpanded] = useState(false);

  return (
    <div ref={barRef} className="cart-checkout" style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: fixedBg, padding: '14px 20px calc(30px + env(safe-area-inset-bottom))', borderTop: `1px solid ${borderColor}`, boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', zIndex: 'var(--z-fixed-actionbar)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', color: subTextColor }}>상품 금액</span>
        <span style={{ fontSize: '13px', color: textColor, fontWeight: '600' }}>₩{totalPrice.toLocaleString()}</span>
      </div>
      {appliedCoupon && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '13px', color: 'var(--primary-dark)' }}>쿠폰 할인</span>
          <span style={{ fontSize: '13px', color: 'var(--primary-dark)', fontWeight: '700' }}>-₩{discountAmount.toLocaleString()}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', color: subTextColor }}>
          배송비
          {freeDeliveryMin > 0 && deliveryFee === 0 && <span style={{ color: 'var(--primary-dark)', marginLeft: 6, fontWeight: 700 }}>무료배송 적용</span>}
        </span>
        <span style={{ fontSize: '13px', color: textColor, fontWeight: '600' }}>₩{deliveryFee.toLocaleString()}</span>
      </div>
      {/* 보유 쿠폰 선택 */}
      {myCoupons.length > 0 && (
        <div style={{ marginBottom: '8px', padding: '10px 14px', background: darkMode ? '#2a1a10' : '#fff8f0', borderRadius: 12, border: `1px solid ${darkMode ? '#3a2a20' : '#ffe0b2'}` }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#e65100', marginBottom: 6 }}>보유 쿠폰 ({myCoupons.length}장)</div>
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
      {/* 포인트 사용 — 기본 접힘(한 줄 요약 + 펼치기), 탭하면 입력창 펼침 */}
      {myPoints > 0 && (
        <div style={{ marginBottom: '8px', padding: pointsExpanded ? '10px 14px' : '8px 14px', background: darkMode ? '#1a2030' : '#f0f6ff', borderRadius: 12, border: `1px solid ${darkMode ? '#2a3040' : '#d0e4ff'}` }}>
          <div
            onClick={() => setPointsExpanded(v => !v)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: pointsExpanded ? 8 : 0, cursor: 'pointer' }}
          >
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1a73e8' }}>
              포인트 사용{clampedUsePoints > 0 ? ` · −${clampedUsePoints.toLocaleString()}P 적용` : ''}
            </span>
            <span style={{ fontSize: '12px', color: darkMode ? '#8ab4f8' : '#1a73e8', display: 'flex', alignItems: 'center', gap: 4 }}>
              보유 {myPoints.toLocaleString()}P
              <span style={{ display: 'inline-block', transition: 'transform 0.15s', transform: pointsExpanded ? 'rotate(180deg)' : 'none' }}>▾</span>
            </span>
          </div>
          {pointsExpanded && (
            <>
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
            </>
          )}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingTop: '8px', borderTop: `1px solid ${borderColor}` }}>
        <span style={{ fontSize: '15px', fontWeight: '700', color: textColor }}>총 결제금액</span>
        <span style={{ fontSize: '22px', fontWeight: '900', color: 'var(--primary)' }}>₩{finalPrice.toLocaleString()}</span>
      </div>
      <button
        disabled={!canPay}
        onClick={onPay}
        style={{ width: '100%', padding: '14px', background: !canPay ? '#dee2e6' : 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', cursor: !canPay ? 'not-allowed' : 'pointer', fontWeight: '800', boxShadow: !canPay ? 'none' : '0 4px 20px rgba(0,196,113,0.35)', letterSpacing: '-0.3px' }}>
        {!zipcode ? '주소를 검색해주세요' : !deliveryInfo?.zoneName ? '배송 구역을 확인해주세요' : payLabel}
      </button>
    </div>
  );
}

export default SummaryBar;
