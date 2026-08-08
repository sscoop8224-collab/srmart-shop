import { useEffect } from 'react';

// 범용 확인 모달 — shop 커스텀 모달 톤(StoreSelectionModal/ForcePasswordChangeModal과 동일
// overlay/카드 스타일)을 따르되, 이 모달은 취소 버튼·배경 클릭·ESC 셋 다로 닫힌다(그 둘은
// "반드시 선택" 모달이라 닫기 동작이 없었음 — 이건 확인/취소 성격이라 다름).
// window.confirm 대체용. 사용: {show && <ConfirmModal message="..." onConfirm={...} onCancel={...} />}
export default function ConfirmModal({
  icon = '🚪',
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}>
      <div style={modalStyle}>
        {icon && <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>{icon}</div>}
        <p style={{ margin: '0 0 22px', fontSize: 15, fontWeight: 700, textAlign: 'center', color: '#14110F', lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={cancelButtonStyle}>{cancelLabel}</button>
          <button onClick={onConfirm} style={confirmButtonStyle}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999, padding: 20,
};
const modalStyle = {
  background: '#fff', padding: '28px 24px', borderRadius: 16,
  width: '100%', maxWidth: 320,
  boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  boxSizing: 'border-box',
};
const cancelButtonStyle = {
  flex: 1, padding: '13px', borderRadius: 12,
  border: '1.5px solid rgba(31,169,56,0.18)', background: '#F2FBF4',
  color: '#6B6259', fontSize: 14, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit',
};
const confirmButtonStyle = {
  flex: 1, padding: '13px', borderRadius: 12, border: 'none',
  background: 'linear-gradient(180deg, #2BC047 0%, #178A2D 100%)',
  color: '#fff', fontSize: 14, fontWeight: 700,
  cursor: 'pointer', boxShadow: '0 6px 16px rgba(23,138,45,0.28)',
  fontFamily: 'inherit',
};
