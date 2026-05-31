import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

function applyDarkVars(dark) {
  const el = document.documentElement;
  document.body.classList.toggle('dark', dark);
  if (dark) {
    el.style.setProperty('--white', '#1a1a1a');
    el.style.setProperty('--gray-50', '#1e1e1e');
    el.style.setProperty('--gray-100', '#242424');
    el.style.setProperty('--gray-200', '#2e2e2e');
    el.style.setProperty('--gray-300', '#3a3a3a');
    el.style.setProperty('--gray-400', '#4a4a4a');
    el.style.setProperty('--gray-500', '#6e6e6e');
    el.style.setProperty('--gray-600', '#9e9e9e');
    el.style.setProperty('--gray-700', '#c0c0c0');
    el.style.setProperty('--gray-800', '#d4d4d4');
    el.style.setProperty('--gray-900', '#f0f0f0');
  } else {
    el.style.setProperty('--white', '#ffffff');
    el.style.setProperty('--gray-50', '#f8f9fa');
    el.style.setProperty('--gray-100', '#f1f3f5');
    el.style.setProperty('--gray-200', '#e9ecef');
    el.style.setProperty('--gray-300', '#dee2e6');
    el.style.setProperty('--gray-400', '#ced4da');
    el.style.setProperty('--gray-500', '#adb5bd');
    el.style.setProperty('--gray-600', '#868e96');
    el.style.setProperty('--gray-700', '#495057');
    el.style.setProperty('--gray-800', '#343a40');
    el.style.setProperty('--gray-900', '#212529');
  }
}

export function ThemeProvider({ children }) {
  const [darkMode, setDarkModeState] = useState(() => {
    const saved = localStorage.getItem('srmart_dark_mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // 시스템 모드 변경 자동 감지
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (localStorage.getItem('srmart_dark_manual') !== 'true') {
        setDarkModeState(e.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // CSS 변수 + localStorage 동기화
  useEffect(() => {
    localStorage.setItem('srmart_dark_mode', darkMode);
    applyDarkVars(darkMode);
  }, [darkMode]);

  // 수동 토글 (manual 플래그 저장)
  const setDarkMode = (val) => {
    const next = typeof val === 'function' ? val(darkMode) : val;
    setDarkModeState(next);
    localStorage.setItem('srmart_dark_manual', 'true');
  };

  // 시스템 설정 복원
  const resetToSystem = () => {
    localStorage.removeItem('srmart_dark_manual');
    localStorage.removeItem('srmart_dark_mode');
    setDarkModeState(window.matchMedia('(prefers-color-scheme: dark)').matches);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, resetToSystem }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
