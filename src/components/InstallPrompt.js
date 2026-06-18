import { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';

const DISMISSED_KEY = 'srmart_pwa_dismissed_at';
const DISMISS_DAYS  = 7;

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

export default function InstallPrompt() {
  const { darkMode } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow]                     = useState(false);
  const [showIOS, setShowIOS]               = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      const days = (Date.now() - Number(dismissed)) / (1000 * 60 * 60 * 24);
      if (days < DISMISS_DAYS) return;
    }

    if (isIOS()) {
      // iOS: Safari 공유 메뉴 안내 (3초 딜레이)
      const t = setTimeout(() => setShowIOS(true), 3000);
      return () => clearTimeout(t);
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setShow(false);
    setShowIOS(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    }
    setDeferredPrompt(null);
    setShow(false);
  };

  const cardStyle = {
    position: 'fixed',
    bottom: 80,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 32px)',
    maxWidth: 440,
    background: darkMode ? '#1e1e1e' : '#ffffff',
    border: `1.5px solid ${darkMode ? '#2e2e2e' : '#d4f5e9'}`,
    borderRadius: 20,
    padding: '16px 18px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    zIndex: 9999,
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
    animation: 'slideUp 0.3s ease',
  };

  if (!show && !showIOS) return null;

  return (
    <>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
      <div style={cardStyle}>
        <div style={{ width: 44, height: 44, background: '#e8f5e9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img src="/icons/icon-72.png" alt="SR마트" style={{ width: 32, height: 32, borderRadius: 8 }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: darkMode ? '#f0f0f0' : '#1a1a1a', marginBottom: 3 }}>
            {showIOS ? '홈 화면에 추가하기' : 'SR마트 앱 설치'}
          </div>
          <div style={{ fontSize: 12, color: darkMode ? '#aaa' : '#666', lineHeight: 1.5, marginBottom: 10 }}>
            {showIOS
              ? <>Safari 하단 <strong>공유</strong> 버튼을 누른 뒤 <strong>"홈 화면에 추가"</strong>를 선택하세요</>
              : '홈 화면에 추가하면 앱처럼 빠르게 실행할 수 있어요'}
          </div>
          {!showIOS && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={install} style={{
                background: 'linear-gradient(135deg, #00c471, #00a85e)',
                color: 'white', border: 'none', borderRadius: 10,
                padding: '8px 16px', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,196,113,0.3)',
              }}>설치</button>
              <button onClick={dismiss} style={{
                background: 'transparent', color: darkMode ? '#888' : '#999',
                border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                borderRadius: 10, padding: '8px 12px', fontSize: 12, cursor: 'pointer',
              }}>나중에</button>
            </div>
          )}
        </div>
        <button onClick={dismiss} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: darkMode ? '#666' : '#bbb', fontSize: 18, lineHeight: 1, padding: 2,
        }}>✕</button>
      </div>
    </>
  );
}
