import { useEffect } from 'react';
import Icon from './ui/Icon';

// 범용 확인 모달 — 모양은 목업 S34 의 .alert(styles/ui.css, DialogContext 와 같은 창). 묶음 1(2026-11-12).
// 취소 버튼·배경 클릭·ESC 셋 다로 닫힌다. 취소는 왼쪽(안전한 쪽).
// window.confirm 대체용. 사용: {show && <ConfirmModal message="..." onConfirm={...} onCancel={...} />}
// icon 은 목업 ICON 이름(예전엔 이모지였다).
export default function ConfirmModal({
  icon = 'logout',
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="overlay center" role="alertdialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}>
      <div className="alert">
        <div className="ab">
          {icon && <Icon name={icon} size={'lg' + (danger ? ' warn' : '')} />}
          <b>{message}</b>
        </div>
        <div className="af">
          <button type="button" className={danger ? 'b' : ''} onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={danger ? 'danger' : 'b'} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
