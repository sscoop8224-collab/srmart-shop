// 픽업 기한 표기 — 서버 값만 읽는다(앱이 계산하지 않는다 · 2026-11-17 낮 지시 5)
import { pickupDeadlineLabel, pickupDeadlineDate } from './pickupDeadline';

test('DB 모양(YYYY-MM-DD HH:mm:ss)은 그 날짜 그대로 — 시간대에 따라 하루 밀리지 않는다', () => {
  expect(pickupDeadlineLabel('2026-11-20 23:59:59')).toBe('11월 20일(금)까지');
});

test('JSON 날짜(ISO)는 그 지역 날짜로', () => {
  const iso = new Date(2026, 10, 20, 23, 59, 59).toISOString();   // 이 기기 지역의 11/20 23:59:59
  expect(pickupDeadlineLabel(iso)).toBe('11월 20일(금)까지');
});

test('없거나 못 읽으면 빈 문자열 — 화면이 「undefined월」을 그리지 않게', () => {
  expect(pickupDeadlineLabel(null)).toBe('');
  expect(pickupDeadlineLabel('')).toBe('');
  expect(pickupDeadlineLabel('모름')).toBe('');
  expect(pickupDeadlineDate(undefined)).toBeNull();
});
