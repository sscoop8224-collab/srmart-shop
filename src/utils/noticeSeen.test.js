// 홈 종 빨간 점 판정 (개발 표 #22 · 2026-11-17 낮 지시 5)
import { hasNewNotice, markSeen, readSeen, latestOf, NOTICE_SEEN_KEY } from './noticeSeen';

const NOW = new Date(2026, 10, 17, 12, 0);
const L = (...ts) => ts.map((t, i) => ({ id: i + 1, created_at: t }));

beforeEach(() => localStorage.clear());

test('처음(본 기록 없음): 최근 14일 안의 공지가 있으면 점 — 오래된 공지만 있으면 안 켠다', () => {
  expect(hasNewNotice(L('2026-11-16 09:00'), '', NOW)).toBe(true);
  expect(hasNewNotice(L('2026-10-01 09:00'), '', NOW)).toBe(false);
  expect(hasNewNotice([], '', NOW)).toBe(false);
});

test('본 것보다 늦은 공지가 있을 때만', () => {
  expect(hasNewNotice(L('2026-11-16 09:00', '2026-11-10 09:00'), '2026-11-16 09:00', NOW)).toBe(false);
  expect(hasNewNotice(L('2026-11-16 09:01'), '2026-11-16 09:00', NOW)).toBe(true);
});

test('공지 화면에서 본 것으로 적으면 점이 꺼지고, 기록은 뒤로 가지 않는다', () => {
  markSeen(L('2026-11-16 09:00', '2026-11-12 10:00'));
  expect(readSeen()).toBe('2026-11-16 09:00');
  expect(localStorage.getItem(NOTICE_SEEN_KEY)).toBe('2026-11-16 09:00');
  expect(hasNewNotice(L('2026-11-16 09:00'), undefined, NOW)).toBe(false);
  markSeen(L('2026-11-01 08:00'));            // 다른 매장 목록(더 옛것)을 봐도
  expect(readSeen()).toBe('2026-11-16 09:00');
  expect(latestOf([{}, null])).toBe('');
});

test('에스알마트 빌드는 옛 이름 그대로의 키', () => {
  expect(NOTICE_SEEN_KEY).toBe('srmart_notice_seen');
});
