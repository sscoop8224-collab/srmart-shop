// AI 상담(S37) 확인 — 묶음 6.
//
// 이 창에서 틀리면 손해가 큰 것:
//   · **사람이 아닌 AI 라는 고지**가 맨 위에 늘 있다.
//   · 서버로 가는 값은 예전 그대로 — 메시지 · 이전 대화(오류 말풍선은 빼고) · 지금 매장.
//   · 한글 조합 중 Enter 로는 보내지 않는다(마지막 글자가 잘려 두 번 간다).
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Chatbot from './Chatbot';

jest.mock('../api', () => ({ __esModule: true, default: { post: jest.fn() } }));
jest.mock('../StoreContext', () => ({ useStore: () => ({ currentStoreId: 11 }) }));
const API = require('../api').default;

beforeAll(() => { window.HTMLElement.prototype.scrollIntoView = jest.fn(); });
beforeEach(() => { jest.clearAllMocks(); });

test('닫혀 있으면 아무것도 없다 · 열면 AI 고지', () => {
  const { rerender } = render(<Chatbot open={false} onClose={jest.fn()} />);
  expect(screen.queryByText('쇼핑 도우미')).toBeNull();
  rerender(<Chatbot open onClose={jest.fn()} />);
  expect(screen.getByText('(사람이 아닌 AI 도우미예요)')).toBeInTheDocument();
});

test('보내면 매장·이전 대화와 함께 서버로 · 오류는 말풍선으로, 다음 대화 이력에는 넣지 않는다', async () => {
  API.post.mockRejectedValueOnce(new Error('net')).mockResolvedValueOnce({ data: { reply: '네! 있어요.' } });
  render(<Chatbot open onClose={jest.fn()} />);
  const box = screen.getByLabelText('메시지');
  fireEvent.change(box, { target: { value: '콜라 있어요?' } });
  fireEvent.click(screen.getByRole('button', { name: '보내기' }));
  expect(await screen.findByText('죄송해요, 일시적인 오류가 발생했어요. 다시 시도해 주세요!')).toHaveClass('err');
  expect(API.post).toHaveBeenCalledWith('/chatbot', { message: '콜라 있어요?', history: [], store_id: 11 });

  fireEvent.change(box, { target: { value: '사이다는요?' } });
  fireEvent.keyDown(box, { key: 'Enter' });
  expect(await screen.findByText('네! 있어요.')).toBeInTheDocument();
  expect(API.post).toHaveBeenLastCalledWith('/chatbot', { message: '사이다는요?', history: [{ role: 'user', content: '콜라 있어요?' }], store_id: 11 });
});

test('한글 조합 중 Enter 는 보내지 않는다 · 빈 칸이면 보내기 단추가 꺼져 있다', async () => {
  render(<Chatbot open onClose={jest.fn()} />);
  expect(screen.getByRole('button', { name: '보내기' })).toBeDisabled();
  const box = screen.getByLabelText('메시지');
  fireEvent.change(box, { target: { value: '콜라' } });
  fireEvent.keyDown(box, { key: 'Enter', isComposing: true });
  await waitFor(() => expect(API.post).not.toHaveBeenCalled());
});
