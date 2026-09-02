import { createContext, useCallback, useContext, useRef, useState } from 'react';

// window.confirm()/alert() 대체 전용 커스텀 다이얼로그 — POS UI-GUIDE 5절 패턴을 웹으로 옮김:
// 중앙 부양 카드 + dim 오버레이, 취소는 항상 좌측(안전한 기본), 위험 액션만 확인 버튼이 danger(빨강).
// confirm()은 Promise<boolean>, notify()는 확인 버튼 하나뿐인 안내(alert 대체)로 Promise<void>.
const DialogContext = createContext(null);

function normalize(opts) {
  return typeof opts === 'string' ? { message: opts } : (opts || { message: '' });
}

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null); // { message, title, okLabel, cancelLabel, danger, showCancel }
  const resolveRef = useRef(null);

  const open = useCallback((opts, showCancel) => {
    setDialog({ ...normalize(opts), showCancel });
    return new Promise((resolve) => { resolveRef.current = resolve; });
  }, []);

  const confirm = useCallback((opts) => open(opts, true), [open]);
  const notify = useCallback((opts) => open(opts, false), [open]);

  const settle = (result) => {
    setDialog(null);
    resolveRef.current?.(result);
    resolveRef.current = null;
  };

  return (
    <DialogContext.Provider value={{ confirm, notify }}>
      {children}
      {dialog && (
        <div
          style={overlayStyle}
          onClick={(e) => { if (e.target === e.currentTarget && dialog.showCancel) settle(false); }}
        >
          <div style={modalStyle}>
            {dialog.title && <div style={titleStyle}>{dialog.title}</div>}
            <p style={messageStyle}>{dialog.message}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {dialog.showCancel && (
                <button onClick={() => settle(false)} style={cancelButtonStyle}>
                  {dialog.cancelLabel || '취소'}
                </button>
              )}
              <button onClick={() => settle(true)} style={dialog.danger ? dangerButtonStyle : confirmButtonStyle}>
                {dialog.okLabel || '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog은 DialogProvider 안에서만 쓸 수 있어요.');
  return ctx;
}

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999, padding: 20,
};
const modalStyle = {
  background: 'var(--card)', padding: '28px 24px', borderRadius: 16,
  width: '100%', maxWidth: 320,
  boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  boxSizing: 'border-box',
};
const titleStyle = {
  margin: '0 0 8px', fontSize: 16, fontWeight: 800, textAlign: 'center', color: 'var(--text)',
};
const messageStyle = {
  margin: '0 0 22px', fontSize: 15, fontWeight: 700, textAlign: 'center', color: 'var(--text)', lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
};
const cancelButtonStyle = {
  flex: 1, padding: '13px', borderRadius: 12,
  border: '1.5px solid var(--sep)', background: 'var(--bg)',
  color: 'var(--text2)', fontSize: 14, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit',
};
const confirmButtonStyle = {
  flex: 1, padding: '13px', borderRadius: 12, border: 'none',
  background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
  color: '#fff', fontSize: 14, fontWeight: 700,
  cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,196,113,0.28)',
  fontFamily: 'inherit',
};
const dangerButtonStyle = {
  ...confirmButtonStyle,
  background: 'var(--danger)',
  boxShadow: '0 6px 16px rgba(255,71,87,0.28)',
};
