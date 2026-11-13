// 서버 장바구니(2026-11-13 대표님 지시) — 장바구니 화면(S08A) + 저장소(hooks/useShopCart.js) 확인.
//
// 이 화면에서 틀리면 손해가 큰 것:
//   · 비회원이 담은 것은 이 기기에 남고, **로그인하면 서버로 합친 뒤에만** 기기 쪽을 비운다(실패하면 남긴다).
//   · 같은 상품·같은 포장 단위는 한 줄로 더하고 99개에서 멈춘다 — 박스와 낱개는 다른 줄이다.
//   · 금액은 **서버 값**이다. 살 수 없는 줄은 흐리게 · 이유를 줄 아래에 · 합계에서 빠진다.
//   · 비회원 「주문하기」는 로그인을 묻는다(S34 안내) — 취소하면 아무 데도 안 간다.
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import Cart from './Cart';
import useShopCart, { addGuestLine, lineFromProduct, GUEST_KEY } from '../hooks/useShopCart';

jest.mock('../api', () => ({
  __esModule: true,
  getCart: jest.fn(), previewCart: jest.fn(), putCartLine: jest.fn(), deleteCartLine: jest.fn(),
  clearCartApi: jest.fn(), mergeCart: jest.fn(), imgUrl: (p) => p,
}));
const mockConfirm = jest.fn();
const mockNotify = jest.fn();
jest.mock('../DialogContext', () => ({ useDialog: () => ({ notify: mockNotify, confirm: mockConfirm }) }));
jest.mock('../StoreContext', () => ({ useStore: () => ({ currentStoreId: 1, currentStore: { id: 1, name: '에스알마트 검암점' } }) }));
jest.mock('./Home', () => ({ DeliveryLine: () => null, useDeliveryPromise: () => null }));
jest.mock('../hooks/usePublishBottomBarHeight', () => () => {});
const api = require('../api');

const line = (o) => ({ id: 1, product_id: 101, unit_type: 'unit', quantity: 2, grams: null, name: '농심 메론킥', spec: '60g', image: null,
  status: 'ok', ok: true, message: null, unit_price: 1450, line: 2900, discount_amount: 0, added_unit_price: 1450, price_changed: false, pickup_only: false, ...o });
const VIEW = {
  store: { id: 1, name: '에스알마트 검암점' }, gross: 2900, promo_discount: 0, subtotal: 2900, ok_count: 1, problem_count: 2,
  lines: [
    line({}),
    line({ id: 2, product_id: 102, name: '빙그레 바나나우유', spec: '240ml', status: 'sold_out', ok: false, message: '품절이에요', unit_price: null, line: 0 }),
    line({ id: 3, product_id: 103, name: '참이슬', spec: '360ml', status: 'adult_required', ok: false, message: '주류는 본인확인 뒤에 담을 수 있어요', unit_price: null, line: 0 }),
  ],
};

beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); });

test('줄 합치기 — 같은 상품·같은 단위는 더하고 99에서 멈춘다 · 박스와 낱개는 다른 줄', () => {
  const unit = lineFromProduct({ id: 101 }, 60);
  const box = lineFromProduct({ id: 101, purchase_type: 'box' }, 1);
  let g = addGuestLine([], unit);
  g = addGuestLine(g, unit);
  expect(g).toHaveLength(1);
  expect(g[0].quantity).toBe(99);
  g = addGuestLine(g, box);
  expect(g.map(l => l.unit_type)).toEqual(['unit', 'box']);
  const w = lineFromProduct({ id: 104, pricing_type: 'weight', grams: 300 });
  expect(addGuestLine(addGuestLine([], w), w)[0].grams).toBe(600);
});

test('로그인하면 기기 장바구니를 서버로 합치고, 성공한 뒤에만 기기 쪽을 비운다', async () => {
  localStorage.setItem(GUEST_KEY, JSON.stringify([{ product_id: 101, unit_type: 'unit', quantity: 2, grams: null, snapshot: { name: 'x' } }]));
  api.mergeCart.mockRejectedValueOnce(new Error('net'));
  api.getCart.mockResolvedValue({ data: VIEW });
  const onMerged = jest.fn();
  const { rerender } = renderHook(({ user }) => useShopCart({ user, storeId: 1, onMerged }), { initialProps: { user: { id: 7 } } });
  await waitFor(() => expect(api.mergeCart).toHaveBeenCalledTimes(1));
  expect(api.mergeCart.mock.calls[0][0][0].snapshot).toBeUndefined();   // 화면용 이름은 서버로 안 보낸다
  expect(localStorage.getItem(GUEST_KEY)).not.toBeNull();               // 실패 → 남긴다

  api.mergeCart.mockResolvedValueOnce({ data: { ...VIEW, merged: { added: 1, summed: 0 } } });
  rerender({ user: null });
  rerender({ user: { id: 7 } });
  await waitFor(() => expect(onMerged).toHaveBeenCalledWith(1, expect.anything()));
  expect(localStorage.getItem(GUEST_KEY)).toBeNull();                   // 성공 → 비운다
});

test('회원 — 서버 금액 · 살 수 없는 줄은 이유와 함께 · 주문할 줄은 살 수 있는 것만', async () => {
  api.getCart.mockResolvedValue({ data: VIEW });
  const { result } = renderHook(() => useShopCart({ user: { id: 7 }, storeId: 1 }));
  await waitFor(() => expect(result.current.lines).toHaveLength(3));
  expect(result.current.orderItems.map(i => i.id)).toEqual([101]);
  expect(result.current.orderItems[0].price).toBe(1450);

  const onOrder = jest.fn();
  render(<Cart cart={result.current} loggedIn onLogin={jest.fn()} onOrder={onOrder} onHome={jest.fn()} />);
  expect(screen.getAllByText('2,900원').length).toBeGreaterThan(0);
  expect(screen.getByText(/품절이에요/)).toBeInTheDocument();
  expect(screen.getByText('가격은 본인확인 뒤에 보여요')).toBeInTheDocument();
  expect(screen.getByText('살 수 없는 상품 2개 빼기')).toBeInTheDocument();
  mockConfirm.mockResolvedValueOnce(true);
  fireEvent.click(screen.getByText('주문하기'));
  await waitFor(() => expect(onOrder).toHaveBeenCalled());
  expect(mockConfirm.mock.calls[0][0].title).toMatch('살 수 없는 상품 2개는 빼고');
});

test('비회원 — 이 기기에 저장 안내 · 「로그인하고 주문하기」는 로그인을 묻고, 취소하면 아무 데도 안 간다', async () => {
  api.previewCart.mockResolvedValue({ data: { ...VIEW, lines: [VIEW.lines[0]], problem_count: 0 } });
  const { result } = renderHook(() => useShopCart({ user: null, storeId: 1 }));
  await act(async () => { await result.current.add({ id: 101, name: '농심 메론킥', spec: '60g', price: 1450 }, 2); });
  expect(JSON.parse(localStorage.getItem(GUEST_KEY))[0].quantity).toBe(2);
  await waitFor(() => expect(api.previewCart).toHaveBeenCalled());
  expect(api.putCartLine).not.toHaveBeenCalled();                       // 비회원은 서버에 쓰지 않는다

  const onLogin = jest.fn();
  const onOrder = jest.fn();
  render(<Cart cart={result.current} loggedIn={false} onLogin={onLogin} onOrder={onOrder} onHome={jest.fn()} />);
  expect(screen.getByText('로그인하지 않았어요')).toBeInTheDocument();
  mockConfirm.mockResolvedValueOnce(false);
  fireEvent.click(screen.getByText('로그인하고 주문하기'));
  await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
  expect(mockConfirm.mock.calls[0][0].title).toBe('주문하려면 로그인해 주세요');
  expect(onLogin).not.toHaveBeenCalled();
  expect(onOrder).not.toHaveBeenCalled();
  mockConfirm.mockResolvedValueOnce(true);
  fireEvent.click(screen.getByText('로그인하고 주문하기'));
  await waitFor(() => expect(onLogin).toHaveBeenCalled());
});
