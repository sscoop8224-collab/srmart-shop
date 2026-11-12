import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

// 화면 모드는 셋이다 — 자동(휴대폰 설정을 따른다) · 밝게 · 어둡게 (목업 P02 「화면 모드」, 묶음 1 · 2026-11-12).
// 색은 전부 styles/tokens.css 가 <html data-theme="light|dark"> 하나를 보고 바꾼다.
// 예전엔 여기서 --white·--gray-* 를 JS 로 하나씩 바꿔 끼웠다 — 그 값도 tokens.css 로 옮겼다.
const MODE_KEY = 'srmart_theme_mode';           // 'auto' | 'light' | 'dark'
const MODES = ['auto', 'light', 'dark'];

// 옛 저장값(srmart_dark_manual · srmart_dark_mode)을 읽어 새 값으로 옮긴다 — 수동으로 골라 둔 손님의 선택을 잃지 않게.
function readMode() {
  try {
    const m = localStorage.getItem(MODE_KEY);
    if (MODES.includes(m)) return m;
    if (localStorage.getItem('srmart_dark_manual') === 'true') {
      return localStorage.getItem('srmart_dark_mode') === 'true' ? 'dark' : 'light';
    }
  } catch { /* 저장소를 못 쓰는 브라우저(사생활 보호 모드) — 자동으로 */ }
  return 'auto';
}

const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
const resolve = (mode) => (mode === 'auto' ? systemDark() : mode === 'dark');

// 정적 <meta name=theme-color media=...> 두 개는 OS 다크모드 기준 폴백일 뿐 — 앱 안에서 고른 모드는
// media query 로 못 잡으므로, media 없는 fallback 태그 하나를 실제 화면 바탕(--bg)과 맞춘다.
function apply(dark) {
  const root = document.documentElement;
  root.setAttribute('data-theme', dark ? 'dark' : 'light');
  document.body.classList.toggle('dark', dark);
  const meta = document.querySelector('meta[name="theme-color"]:not([media])');
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim();   // 색 값은 tokens.css 한 곳에만
  if (meta && bg) meta.setAttribute('content', bg);
}

// 첫 그림 전에 붙인다 — React 가 뜨기 전에 밝은 바탕이 한 번 번쩍이지 않게.
if (typeof document !== 'undefined') apply(resolve(readMode()));

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState(readMode);
  const [darkMode, setResolved] = useState(() => resolve(readMode()));

  // 자동일 때만 휴대폰 설정 바뀜을 따른다
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => { if (themeMode === 'auto') setResolved(e.matches); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [themeMode]);

  useEffect(() => { apply(darkMode); }, [darkMode]);

  const setThemeMode = useCallback((mode) => {
    if (!MODES.includes(mode)) return;
    setThemeModeState(mode);
    setResolved(resolve(mode));
    try {
      localStorage.setItem(MODE_KEY, mode);
      localStorage.removeItem('srmart_dark_manual');
      localStorage.removeItem('srmart_dark_mode');
    } catch { /* 저장 못 해도 이번 화면에는 적용된다 */ }
  }, []);

  // 옛 화면(관리 화면 등)이 쓰는 켜고 끄기 — 밝게/어둡게 중 하나로 고정한다
  const setDarkMode = useCallback((val) => {
    const next = typeof val === 'function' ? val(darkMode) : val;
    setThemeMode(next ? 'dark' : 'light');
  }, [darkMode, setThemeMode]);

  const resetToSystem = useCallback(() => setThemeMode('auto'), [setThemeMode]);

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, darkMode, setDarkMode, resetToSystem }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
