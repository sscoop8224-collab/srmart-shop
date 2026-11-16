// 알림 설정(S50) — 새 디자인으로 옮긴 뒤에도 지켜야 하는 것 (2026-11-17 밤샘 지시 6)
//   · 혜택 알림을 바꾸면 서버가 남긴 날짜로 「동의/거부하셨어요」를 알린다(정보통신망법)
//   · 저장에 실패하면 스위치를 **원래대로 되돌린다** — 화면은 끔인데 서버는 켬이면, 끈 줄 아는 손님에게 행사 푸시가 간다
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationSettings from './NotificationSettings';

jest.mock('../api', () => ({ getNotificationPrefs: jest.fn(), updateNotificationPrefs: jest.fn() }));
const mockNotify = jest.fn(() => Promise.resolve());
jest.mock('../DialogContext', () => ({ useDialog: () => ({ notify: mockNotify }) }));
const api = require('../api');

const PREFS = { order_notify: true, order_notify_at: null, marketing_push: true, marketing_push_at: '2026-11-12 10:00:00' };
beforeEach(() => { jest.clearAllMocks(); api.getNotificationPrefs.mockResolvedValue({ data: PREFS }); });

test('끄면 서버 날짜로 거부를 알리고, 거부 안내 줄이 보인다', async () => {
  api.updateNotificationPrefs.mockResolvedValue({ data: { ...PREFS, marketing_push: false, marketing_push_at: '2026-11-20 09:00:00' } });
  render(<NotificationSettings goBack={() => {}} />);
  const sw = await screen.findByRole('switch', { name: '혜택 알림 (푸시·문자)' });
  expect(sw).toHaveAttribute('aria-checked', 'true');
  expect(sw).toHaveTextContent('2026.11.12 동의');
  fireEvent.click(sw);
  await waitFor(() => expect(mockNotify).toHaveBeenCalled());
  expect(mockNotify.mock.calls[0][0].message).toMatch('2026.11.20 혜택 알림 수신에 거부하셨어요');
  expect(sw).toHaveAttribute('aria-checked', 'false');
  expect(screen.getByText(/혜택 알림 수신을 거부했어요 · 2026\.11\.20/)).toBeInTheDocument();
});

test('저장에 실패하면 스위치를 되돌린다', async () => {
  api.updateNotificationPrefs.mockRejectedValue(new Error('500'));
  render(<NotificationSettings goBack={() => {}} />);
  const sw = await screen.findByRole('switch', { name: '주문·배송 알림' });
  fireEvent.click(sw);
  await waitFor(() => expect(mockNotify).toHaveBeenCalledWith('저장하지 못했어요. 잠시 후 다시 시도해 주세요.'));
  expect(sw).toHaveAttribute('aria-checked', 'true');
});

test('불러오기 실패 — 이유와 다시 시도', async () => {
  api.getNotificationPrefs.mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce({ data: PREFS });
  render(<NotificationSettings goBack={() => {}} />);
  fireEvent.click(await screen.findByRole('button', { name: '다시 시도' }));
  expect(await screen.findByRole('switch', { name: '주문·배송 알림' })).toBeInTheDocument();
});
