import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Icon from './components/ui/Icon';

// window.confirm()/alert() 대체 전용 커스텀 다이얼로그 — POS UI-GUIDE 5절 패턴을 웹으로 옮김:
// 중앙 부양 카드 + dim 오버레이, 취소는 항상 좌측(안전한 기본), 위험 액션만 확인 버튼이 danger(빨강).
// confirm()은 Promise<boolean>, notify()는 확인 버튼 하나뿐인 안내(alert 대체)로 Promise<void>.
// 모양은 목업 S34 의 .alert(styles/ui.css) — 제목이 없으면 문구를 굵게 한 줄로 쓴다. opts.icon 으로 위 아이콘(목업 ICON 이름) — 묶음 1.
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
          className="overlay center"
          role="alertdialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget && dialog.showCancel) settle(false); }}
        >
          <div className="alert">
            <div className="ab">
              {dialog.icon && <Icon name={dialog.icon} size={'lg' + (dialog.danger ? ' warn' : '')} />}
              <b>{dialog.title || dialog.message}</b>
              {dialog.title && dialog.message && <p>{dialog.message}</p>}
            </div>
            <div className="af">
              {dialog.showCancel && (
                <button type="button" className={dialog.danger ? 'b' : ''} onClick={() => settle(false)}>
                  {dialog.cancelLabel || '취소'}
                </button>
              )}
              <button type="button" className={dialog.danger ? 'danger' : 'b'} onClick={() => settle(true)}>
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

