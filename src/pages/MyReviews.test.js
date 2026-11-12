// 최근 본 상품(S41)·내 리뷰(S42) 확인 — 묶음 6.
//
// 이 화면에서 틀리면 손해가 큰 것:
//   · 최근 본 상품은 **지금 매장 상품 목록의 가격**으로 보인다(서버 응답에는 가격이 없다) — 안 파는 상품은 빼고 **몇 개 뺐는지 말한다.**
//   · 리뷰 삭제는 **확인창을 거친다** — 취소하면 지우지 않는다.
//   · 리뷰 날짜는 UTC ISO 로 와도 **기기 날짜**로 찍는다(앞 10자를 자르면 하루 밀린다).
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RecentViews from './RecentViews';
import MyReviews from './MyReviews';

jest.mock('../api', () => ({
  __esModule: true,
  getRecentViews: jest.fn(),
  getMyReviews: jest.fn(),
  deleteReview: jest.fn(),
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

beforeEach(() => { jest.clearAllMocks(); });

test('최근 본 상품 — 지금 매장 가격으로 보이고, 안 파는 것은 빼고 개수를 말한다', async () => {
  api.getRecentViews.mockResolvedValue({ data: [{ product_id: 104 }, { product_id: 999 }, { product_id: 101 }] });
  render(<RecentViews products={PRODUCTS} goBack={jest.fn()} goToHome={jest.fn()} onProductClick={jest.fn()} onAddToCart={jest.fn()} onToggleWish={jest.fn()} />);
  expect(await screen.findByText('부사 사과')).toBeInTheDocument();
  expect(screen.getByText('12,900원')).toBeInTheDocument();
  expect(screen.getByText('지금 매장에서 팔지 않는 상품 1개는 빼고 보여 드려요.')).toBeInTheDocument();
});

test('최근 본 상품 — 비어 있으면 빈 화면 · 못 불러오면 다시 시도', async () => {
  api.getRecentViews.mockResolvedValueOnce({ data: [] });
  const { unmount } = render(<RecentViews products={PRODUCTS} goBack={jest.fn()} goToHome={jest.fn()} />);
  expect(await screen.findByText('최근 본 상품이 없어요')).toBeInTheDocument();
  unmount();
  api.getRecentViews.mockRejectedValueOnce(new Error('net')).mockResolvedValueOnce({ data: [{ product_id: 101 }] });
  render(<RecentViews products={PRODUCTS} goBack={jest.fn()} goToHome={jest.fn()} onProductClick={jest.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: '다시 시도' }));
  expect(await screen.findByText('농심 메론킥')).toBeInTheDocument();
});

test('내 리뷰 — 별점·답글·기기 날짜 · 삭제는 확인창을 거친다', async () => {
  api.getMyReviews.mockResolvedValue({ data: [
    { id: 31, product_id: 101, rating: 5, content: '또 살게요!', reply: '감사합니다 :)', created_at: '2026-11-02T01:00:00.000Z', product_name: '농심 메론킥' },
    { id: 30, product_id: 104, rating: 4, content: '달고 아삭해요.', reply: null, created_at: '2026-10-28T01:00:00.000Z', product_name: '부사 사과' },
  ] });
  api.deleteReview.mockResolvedValue({ data: {} });
  render(<MyReviews products={PRODUCTS} goBack={jest.fn()} />);
  expect(await screen.findByText('또 살게요!')).toBeInTheDocument();
  expect(screen.getByText('사장님 답글 · 감사합니다 :)')).toBeInTheDocument();
  expect(screen.getByLabelText('별점 4점')).toBeInTheDocument();
  expect(screen.getByText('부사 사과 1.5kg')).toBeInTheDocument();   // 규격은 필수 — 서버 응답에 없어 상품 목록에서
  const d = new Date('2026-11-02T01:00:00.000Z');
  expect(screen.getByText(`${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`)).toBeInTheDocument();

  mockConfirm.mockResolvedValueOnce(false);
  fireEvent.click(screen.getAllByRole('button', { name: '삭제' })[0]);
  await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
  expect(api.deleteReview).not.toHaveBeenCalled();
  mockConfirm.mockResolvedValueOnce(true);
  fireEvent.click(screen.getAllByRole('button', { name: '삭제' })[0]);
  await waitFor(() => expect(api.deleteReview).toHaveBeenCalledWith(31));
  await waitFor(() => expect(screen.queryByText('또 살게요!')).toBeNull());
});

test('내 리뷰 — 비어 있으면 빈 화면', async () => {
  api.getMyReviews.mockResolvedValue({ data: [] });
  render(<MyReviews products={PRODUCTS} goBack={jest.fn()} />);
  expect(await screen.findByText('아직 쓴 리뷰가 없어요')).toBeInTheDocument();
});
