// 쿠폰 코드 입력 카드. Cart.js 원본(273~297행)에서 그대로 옮김 — 마크업/스타일 동일.
function CouponCodeBox({ darkMode, appliedCoupon, couponInput, setCouponInput, onApply, onRemove }) {
  const cardBg = darkMode ? '#242424' : 'white';
  const borderColor = darkMode ? '#2e2e2e' : 'var(--primary-light)';
  const textColor = darkMode ? '#f0f0f0' : '#1a1a1a';
  const inputBg = darkMode ? '#2e2e2e' : 'var(--primary-light)';
  const inputBorder = darkMode ? '#3a3a3a' : 'var(--primary-light)';
  const inputStyle = {
    padding: '11px 14px', borderRadius: '12px', border: `1.5px solid ${inputBorder}`,
    fontSize: '14px', outline: 'none', fontFamily: 'inherit',
    background: inputBg, width: '100%', boxSizing: 'border-box',
    color: textColor,
  };

  return (
    <div style={{ margin: '0 16px 10px', background: cardBg, borderRadius: '18px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${borderColor}` }}>
      <p style={{ fontSize: '14px', fontWeight: '700', color: textColor, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
        쿠폰 코드
      </p>
      {appliedCoupon ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: darkMode ? '#2e2e2e' : 'var(--primary-light)', borderRadius: '12px', padding: '12px 14px', border: `1px solid ${inputBorder}` }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary-dark)', margin: '0 0 2px' }}>{appliedCoupon.code}</p>
            <p style={{ fontSize: '12px', color: 'var(--primary-dark)', margin: 0 }}>{appliedCoupon.description}</p>
          </div>
          <button onClick={onRemove} style={{ background: 'var(--accent-light)', border: 'none', cursor: 'pointer', color: '#ff4757', fontSize: '12px', padding: '4px 8px', borderRadius: '8px', fontWeight: '700' }}>제거</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)}
            placeholder="쿠폰 코드 입력" style={{ ...inputStyle, flex: 1 }}
            onKeyDown={(e) => { if (e.key === 'Enter') onApply(); }} />
          <button onClick={onApply} style={{ padding: '11px 16px', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' }}>적용</button>
        </div>
      )}
    </div>
  );
}

export default CouponCodeBox;
