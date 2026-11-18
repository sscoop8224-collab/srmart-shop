import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './AuthContext';
import { StoreProvider } from './StoreContext';
import { BRAND } from './brand';

// 브랜드 표시 — tokens.css 의 :root[data-brand="aram"](아람 빨강)이 이것을 본다. index.html 부팅 줄과 같은 값(빌드가 정한 브랜드) · 2026-11-17 낮 지시 6
document.documentElement.setAttribute('data-brand', BRAND.code);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <StoreProvider>
        <App />
      </StoreProvider>
    </AuthProvider>
  </React.StrictMode>
);

// Service Worker 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${process.env.PUBLIC_URL}/service-worker.js`)
      .then((reg) => {
        console.log('[SW] registered, scope:', reg.scope);
        // 새 버전 감지 시 자동 업데이트
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] new version available');
            }
          });
        });
      })
      .catch((err) => console.error('[SW] registration failed:', err));
  });
}

reportWebVitals();
