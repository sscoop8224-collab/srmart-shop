// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// jsdom 에는 window.matchMedia 가 없다 — 테마(ThemeContext)·설치 안내(InstallPrompt)가 부른다.
// 밝게 · 브라우저 탭(설치 안 됨)으로 흉내 낸다. 시험이 따로 정의했으면 그것을 쓴다(2026-11-13 16항목 14).
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query) => ({
    matches: false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  });
}
