import { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';

export default function Offline({ onRetry }) {
  const { darkMode } = useTheme();
  const [checking, setChecking] = useState(false);

  const handleRetry = async () => {
    setChecking(true);
    try {
      await fetch('/manifest.json', { cache: 'no-store' });
      if (onRetry) onRetry();
      else window.location.reload();
    } catch {
      setChecking(false);
    }
  };

  const bg   = darkMode ? '#111' : '#f8fffe';
  const text = darkMode ? '#f0f0f0' : '#1a1a1a';
  const sub  = darkMode ? '#888' : '#666';
  const card = darkMode ? '#1e1e1e' : '#ffffff';

  return (
    <div style={{ background: bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ background: card, borderRadius: 24, padding: '40px 32px', maxWidth: 360, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ width: 80, height: 80, background: '#e8f5e9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" y1="20" x2="12.01" y2="20"/>
          </svg>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: text, marginBottom: 10 }}>인터넷 연결 없음</div>
        <div style={{ fontSize: 14, color: sub, lineHeight: 1.6, marginBottom: 28 }}>
          네트워크 연결을 확인하고<br />다시 시도해주세요
        </div>
        <button onClick={handleRetry} disabled={checking} style={{
          width: '100%', padding: 14,
          background: checking ? '#ccc' : 'linear-gradient(135deg, #00c471, #00a85e)',
          color: 'white', border: 'none', borderRadius: 14,
          fontSize: 15, fontWeight: 700, cursor: checking ? 'not-allowed' : 'pointer',
          boxShadow: checking ? 'none' : '0 4px 16px rgba(0,196,113,0.3)',
          fontFamily: 'inherit',
        }}>
          {checking ? '연결 확인 중...' : '다시 시도'}
        </button>
      </div>
    </div>
  );
}
