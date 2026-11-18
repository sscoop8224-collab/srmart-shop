// 최근 본 상품 「편집」(지우기) 확인 — 2026-11-17 낮 지시 5
//
// 틀리면 손해가 큰 것:
//   · 지우기가 실패하면(옛 서버 404 포함) 목록을 그대로 두고 알린다 — 지운 척하지 않는다.
//   · 「모두 지우기」는 확인을 묻고, 취소하면 지우지 않는다. 안 보이는(지금 매장에서 안 파는) 것까지 지운다는 걸 문구에 적는다.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RecentViews from './RecentViews';

jest.mock('../api', () => ({
  __esModule: true,
  getRecentViews: jest.fn(),
  deleteRecentView: jest.fn(),
  imgUrl: (p) => p,
}));
const mockConfirm = jest.fn();
const mockNotify = jest.fn();
jest.mock('../DialogContext', () => ({ useDialog: () => ({ notify: mockNotify, confirm: mockConfirm }) }));
const api = require('../api');

const PRODUCTS = [
  { id: 101, name: '농심 메론킥', spec: '60g', large: '과자/간식', price: 1450 },
  { id: 104, name: '부사 사과', spec: '1.5kg', large: '농산물', price: 12900 },
];
const view = () => render(<RecentViews products={PRODUCTS} goBack={jest.fn()} goToHome={jest.fn()} onProductClick={jest.fn()} onAddToCart={jest.fn()} onToggleWish={jest.fn()} />);

beforeEach(() => {
  jest.clearAllMocks();
  api.getRecentViews.mockResolvedValue({ data: [{ product_id: 104 }, { product_id: 999 }, { product_id: 101 }] });
});

test('편집 → 하나 지우기는 그 상품만 서버에 지우고 목록에서 뺀다', async () => {
  api.deleteRecentView.mockResolvedValue({ data: { deleted: 1 } });
  view();
  await screen.findByText('부사 사과');
  expect(screen.queryByRole('button', { name: '부사 사과 지우기' })).toBeNull();   // 편집 전에는 단추가 없다
  fireEvent.click(screen.getByRole('button', { name: '편집' }));
  fireEvent.click(screen.getByRole('button', { name: '부사 사과 지우기' }));
  await waitFor(() => expect(screen.queryByText('부사 사과')).toBeNull());
  expect(api.deleteRecentView).toHaveBeenCalledWith(104);
  expect(screen.getByText('농심 메론킥')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '완료' }));
  expect(screen.queryByRole('button', { name: '농심 메론킥 지우기' })).toBeNull();
});

test('지우기가 실패하면(옛 서버 404) 목록 그대로 · 알린다', async () => {
  api.deleteRecentView.mockRejectedValue(Object.assign(new Error('404'), { response: { status: 404 } }));
  view();
  await screen.findByText('부사 사과');
  fireEvent.click(screen.getByRole('button', { name: '편집' }));
  fireEvent.click(screen.getByRole('button', { name: '부사 사과 지우기' }));
  await waitFor(() => expect(mockNotify).toHaveBeenCalled());
  expect(mockNotify.mock.calls[0][0].title).toBe('지우지 못했어요');
  expect(screen.getByText('부사 사과')).toBeInTheDocument();
});

test('모두 지우기 — 확인을 묻고(안 보이는 것까지 센다), 취소하면 안 지운다', async () => {
  api.deleteRecentView.mockResolvedValue({ data: { deleted: 3 } });
  view();
  await screen.findByText('부사 사과');
  fireEvent.click(screen.getByRole('button', { name: '편집' }));
  mockConfirm.mockResolvedValueOnce(false);
  fireEvent.click(screen.getByRole('button', { name: '모두 지우기' }));
  await waitFor(() => expect(mockConfirm).toHaveBeenCalledTimes(1));
  expect(mockConfirm.mock.calls[0][0].message).toBe('지금 매장에서 팔지 않아 안 보이는 1개까지 3개를 지워요.');
  expect(api.deleteRecentView).not.toHaveBeenCalled();
  mockConfirm.mockResolvedValueOnce(true);
  fireEvent.click(screen.getByRole('button', { name: '모두 지우기' }));
  expect(await screen.findByText('최근 본 상품이 없어요')).toBeInTheDocument();
  expect(api.deleteRecentView).toHaveBeenCalledWith();
  expect(screen.queryByRole('button', { name: '편집' })).toBeNull();   // 비면 편집 단추도 없다
});
