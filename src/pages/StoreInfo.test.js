// 매장안내(S44)·고객센터(S46) 확인 — 묶음 6.
//
// 이 화면에서 틀리면 손해가 큰 것:
//   · 「이 매장으로」는 **확인창을 거친다**(장바구니 가격·배송이 바뀐다) · 매장을 못 바꾸는 사람(회원)에게는 단추가 없다.
//   · 전화는 그 매장의 **실제 번호**로 건다(서버 phone) — 비어 있으면 단추를 두지 않는다(지어내지 않는다).
//   · 고객센터 맨 위는 **내 매장** 전화 · 다른 매장 목록에는 내 매장이 다시 나오지 않는다.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import StoreInfo from './StoreInfo';
import CustomerCenter from './CustomerCenter';

jest.mock('../api', () => ({ __esModule: true, getStores: jest.fn(), getShopFaqs: jest.fn() }));
jest.mock('../StoreContext', () => ({ useStore: () => ({ currentStoreId: 11 }) }));
const mockConfirm = jest.fn();
jest.mock('../DialogContext', () => ({ useDialog: () => ({ notify: jest.fn(), confirm: mockConfirm }) }));
const api = require('../api');

const STORES = [
  { id: 1, name: '에스알마트 검암점', display_name: '에스알마트 검암점', address: '인천 서구 검암동', phone: '032-562-5241', operating_hours: '08:00~22:00' },
  { id: 11, name: '에스알마트 왕길점', display_name: '에스알마트 왕길점', address: '인천 서구 왕길동', phone: '032-566-9949', operating_hours: '09:00~22:00' },
  { id: 13, name: '아람마트 고촌점', display_name: '아람마트 고촌점', address: '경기 김포시 고촌읍', phone: null, operating_hours: null },
];

beforeEach(() => {
  jest.clearAllMocks();
  api.getStores.mockResolvedValue({ data: STORES });
  api.getShopFaqs.mockResolvedValue({ data: [{ id: 1, question: '주문을 취소하고 싶어요', answer: '배송 준비 전이면 주문내역에서 바로 취소할 수 있어요.' }] });
});

test('매장안내 — 내 매장 표시 · 전화는 실제 번호 · 번호 없는 매장은 전화 단추 없음 · 바꾸기는 확인 뒤', async () => {
  const onChoose = jest.fn();
  render(<StoreInfo goBack={jest.fn()} onChooseStore={onChoose} />);
  expect(await screen.findByText('에스알마트 왕길점')).toBeInTheDocument();
  expect(screen.getByText('내 매장')).toBeInTheDocument();
  const calls = screen.getAllByRole('link', { name: '전화' });
  expect(calls).toHaveLength(2);
  expect(calls[0]).toHaveAttribute('href', 'tel:0325625241');
  // 내 매장(왕길점)에는 「이 매장으로」가 없다 → 검암점·고촌점 둘
  const choose = screen.getAllByRole('button', { name: '이 매장으로' });
  expect(choose).toHaveLength(2);
  mockConfirm.mockResolvedValueOnce(false);
  fireEvent.click(choose[0]);
  await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
  expect(onChoose).not.toHaveBeenCalled();
  mockConfirm.mockResolvedValueOnce(true);
  fireEvent.click(choose[0]);
  await waitFor(() => expect(onChoose).toHaveBeenCalledWith(1));
});

test('매장안내 — 회원(바꿀 수 없음)에게는 「이 매장으로」가 없다 · 못 불러오면 다시 시도', async () => {
  api.getStores.mockRejectedValueOnce(new Error('net'));
  render(<StoreInfo goBack={jest.fn()} onChooseStore={null} />);
  fireEvent.click(await screen.findByRole('button', { name: '다시 시도' }));
  expect(await screen.findByText('에스알마트 검암점')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '이 매장으로' })).toBeNull();
});

test('고객센터 — 맨 위는 내 매장 전화 · 다른 매장에는 내 매장·번호 없는 매장이 없다 · 질문 펼침 · AI 상담', async () => {
  const onChat = jest.fn();
  render(<CustomerCenter goBack={jest.fn()} onOpenChat={onChat} />);
  const mine = await screen.findByText('왕길점에 전화하기');
  expect(mine.closest('a')).toHaveAttribute('href', 'tel:0325669949');
  expect(screen.getByText('에스알마트 검암점')).toBeInTheDocument();
  expect(screen.queryByText('에스알마트 왕길점')).toBeNull();
  expect(screen.queryByText('아람마트 고촌점')).toBeNull();
  fireEvent.click(await screen.findByText('주문을 취소하고 싶어요'));
  expect(screen.getByText('배송 준비 전이면 주문내역에서 바로 취소할 수 있어요.')).toBeInTheDocument();
  fireEvent.click(screen.getByText('AI 상담'));
  expect(onChat).toHaveBeenCalled();
});

test('고객센터 — 질문을 못 불러오면 그렇게 말한다', async () => {
  api.getShopFaqs.mockRejectedValueOnce(new Error('net'));
  render(<CustomerCenter goBack={jest.fn()} onOpenChat={jest.fn()} />);
  expect(await screen.findByText('질문을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.')).toBeInTheDocument();
});
