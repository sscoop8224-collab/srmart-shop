import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './AuthContext';
import { StoreProvider } from './StoreContext';

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
      .register('/service-worker.js')
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
