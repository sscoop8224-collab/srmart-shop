// 앱 설치 안내(S38) 확인 — 묶음 6.
//
// 이 안내에서 틀리면 손해가 큰 것:
//   · **닫으면 7일 동안 다시 안 뜬다**(매번 뜨면 손님이 쇼핑을 못 한다) — 홈페이지 「앱 다운로드」(?install=1)로 오면 바로 뜬다.
//   · 안드로이드 「설치」는 브라우저 설치 창을 부른다.
import { act, fireEvent, render, screen } from '@testing-library/react';
import InstallPrompt from './InstallPrompt';

const KEY = 'srmart_pwa_dismissed_at';

beforeEach(() => {
  jest.useFakeTimers();
  localStorage.clear();
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {} }));
  window.history.replaceState(null, '', '/');
});
afterEach(() => { jest.useRealTimers(); });

const fireInstallEvent = () => {
  const e = new Event('beforeinstallprompt');
  e.prompt = jest.fn();
  e.userChoice = Promise.resolve({ outcome: 'accepted' });
  act(() => { window.dispatchEvent(e); });
  return e;
};

test('안드로이드 — 3초 뒤 카드 · 「설치」는 브라우저 설치 창 · 닫으면 7일 숨김', async () => {
  render(<InstallPrompt />);
  const e = fireInstallEvent();
  expect(screen.queryByText('에스알마트 앱 설치')).toBeNull();
  act(() => { jest.advanceTimersByTime(3000); });
  expect(screen.getByText('에스알마트 앱 설치')).toBeInTheDocument();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: '설치' })); });
  expect(e.prompt).toHaveBeenCalled();
  expect(Number(localStorage.getItem(KEY))).toBeGreaterThan(0);
});

test('닫은 지 7일 안이면 안 뜬다 · ?install=1 이면 그래도 바로 뜬다', () => {
  localStorage.setItem(KEY, String(Date.now()));
  const { unmount } = render(<InstallPrompt />);
  fireInstallEvent();
  act(() => { jest.advanceTimersByTime(5000); });
  expect(screen.queryByText('에스알마트 앱 설치')).toBeNull();
  unmount();
  window.history.replaceState(null, '', '/?install=1');
  render(<InstallPrompt />);
  fireInstallEvent();
  act(() => { jest.advanceTimersByTime(0); });
  expect(screen.getByText('에스알마트 앱 설치')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '닫기' }));
  expect(screen.queryByText('에스알마트 앱 설치')).toBeNull();
});
