// 주문서 금액 = 서버 견적 (2026-11-13 대표님 지시 2·3) — hooks/useCheckoutFlow.js · components/checkout/CheckoutParts.jsx
//
// 여기서 틀리면 손해가 큰 것:
//   · 주문서가 견적에 실은 줄·쿠폰과 **주문에 싣는 줄·쿠폰이 같아야** 한다 — 다르면 견적과 결제 금액이 갈라진다(409).
//   · 결제 금액 = 견적의 「포인트 전 금액」 − 포인트. 화면이 단가 × 수량으로 다시 더하지 않는다(행사가 빠진다).
//   · 견적이 오기 전·실패했을 때·살 수 없는 줄이 있을 때는 **결제 단추가 잠긴다.**
//   · 「상품 금액」(행사 전) 바로 아래 「행사 할인 −○원」 이 보인다(장바구니 바 · 주문 완료와 같은 줄).
// 장바구니 = 주문서 = 실제 주문(서버)은 백엔드 tools/check-shop-amount-parity.cjs --live 가 실제 서버로 맞춘다.
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { useCheckoutFlow, orderLinesOf } from './useCheckoutFlow';
import { PayRows, PayBar, summaryOf } from '../components/checkout/CheckoutParts';
import Receipt from '../pages/Receipt';

jest.mock('../api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
  matchZipcode: jest.fn(), getMyPoints: jest.fn(), getMyActiveCoupons: jest.fn(), quoteOrder: jest.fn(), imgUrl: (p) => p,
}));
const mockNotify = jest.fn();
jest.mock('../DialogContext', () => ({ useDialog: () => ({ notify: mockNotify, confirm: jest.fn() }) }));
jest.mock('../StoreContext', () => ({ useStore: () => ({ currentStoreId: 1, isOwner: false }) }));
jest.mock('./usePublishBottomBarHeight', () => () => {});
const api = require('../api');

const USER = { id: 7, name: '손님', phone: '010-1111-2222', address: '인천 서구 왕길동 1', zipcode: '22600', dong_name: '왕길동' };
const ITEMS = [
  { id: 101, name: '메론킥', price: 1450, quantity: 2, pricing_type: 'unit' },
  { id: 104, name: '음료 박스', price: 10800, quantity: 1, pricing_type: 'unit', purchase_type: 'box' },
  { id: 105, name: '정육', price: 2500, unit_price: 2500, quantity: 1, grams: 300, pricing_type: 'weight' },
];
// 서버 견적(행사 할인 3,240원 · 보유 쿠폰 없음 · 배송비 3,000원)
const QUOTE = {
  store_id: 1, lines: [{ id: 101, ok: true }, { id: 104, ok: true }, { id: 105, ok: true }],
  gross: 21200, promo_discount: 3240, subtotal: 17960, coupon_discount: 0, coupon_error: null,
  delivery_fee: 3000, free_delivery_min: 30000, out_of_zone: false, final_before_points: 20960,
};

beforeEach(() => {
  jest.clearAllMocks();
  api.getMyPoints.mockResolvedValue({ data: { points: 5000 } });
  api.getMyActiveCoupons.mockResolvedValue({ data: [{ id: 1, coupon_id: 81, coupon_name: '보유 10%', discount_type: 'percent', discount: 10 }] });
  api.matchZipcode.mockResolvedValue({ data: { matched: true, zone: { zone_name: '왕길권역', free_delivery_min: 30000 }, delivery_fee: 3000 } });
  api.quoteOrder.mockResolvedValue({ data: QUOTE });
});

async function ready(items = ITEMS) {
  const h = renderHook(({ list }) => useCheckoutFlow(list, { user: USER }), { initialProps: { list: items } });
  await waitFor(() => expect(h.result.current.canPay).toBe(true));
  return h;
}

test('주문 줄 — 낱개·박스·무게를 서버가 읽는 모양으로(가격은 싣지 않는다)', () => {
  expect(orderLinesOf(ITEMS)).toEqual([
    { id: 101, name: '메론킥', quantity: 2, grams: undefined, quantity_type: 'unit' },
    { id: 104, name: '음료 박스', quantity: 1, grams: undefined, quantity_type: 'box' },
    { id: 105, name: '정육', quantity: 1, grams: 300, quantity_type: 'unit' },
  ]);
});

test('금액은 견적 그대로 · 결제 금액 = 포인트 전 금액 − 포인트', async () => {
  const { result } = await ready();
  expect(result.current.totalPrice).toBe(21200);          // 상품 금액(행사 전)
  expect(result.current.promoDiscount).toBe(3240);        // 행사 할인
  expect(result.current.deliveryFee).toBe(3000);
  expect(result.current.finalPrice).toBe(20960);
  act(() => result.current.setUsePoints(1000));
  expect(result.current.finalPrice).toBe(19960);
  act(() => result.current.setUsePoints(999999));          // 보유 5,000 에서 멈춘다
  expect(result.current.clampedUsePoints).toBe(5000);
  expect(result.current.finalPrice).toBe(15960);
});

test('🔴 견적에 실은 줄·쿠폰·배송지 = 주문에 싣는 줄·쿠폰·배송지', async () => {
  const { result } = await ready();
  await act(async () => { await result.current.handleCouponSelect('81'); });
  api.quoteOrder.mockResolvedValue({ data: { ...QUOTE, coupon_discount: 1796, final_before_points: 19164 } });
  await waitFor(() => expect(result.current.finalPrice).toBe(19164));
  const sent = api.quoteOrder.mock.calls[api.quoteOrder.mock.calls.length - 1][0];
  const extras = result.current.buildOrderExtras();
  expect(extras.items).toEqual(sent.items);
  expect(extras.coupon_id).toBe(sent.coupon_id);
  expect(extras.coupon_code).toBe(sent.coupon_code);
  expect(extras.dong).toBe(sent.dong);
  expect(extras.zipcode).toBe(sent.zipcode);
  expect(sent).toMatchObject({ coupon_id: '81', coupon_code: null, dong: '왕길동', zipcode: '22600' });
  expect(result.current.couponDiscount).toBe(1796);
});

test('쿠폰은 한 장 — 코드 쿠폰을 넣으면 보유 쿠폰을 뺀다 · 견적이 쿠폰을 막으면 이유를 말하고 뺀다', async () => {
  const { result } = await ready();
  await act(async () => { await result.current.handleCouponSelect('81'); });
  api.default.post.mockResolvedValue({ data: { code: 'CODE2000', description: '2천원' } });
  act(() => result.current.setCouponInput('code2000'));
  api.quoteOrder.mockResolvedValue({ data: { ...QUOTE, coupon_discount: 0, coupon_error: '최소 주문 금액이 모자라요', final_before_points: 20960 } });
  await act(async () => { await result.current.handleApplyCoupon(); });
  await waitFor(() => expect(mockNotify).toHaveBeenCalledWith('최소 주문 금액이 모자라요'));
  await waitFor(() => expect(result.current.appliedCoupon).toBe(null));
  expect(result.current.selectedCouponId).toBe('');
});

test('견적 전·실패·살 수 없는 줄 — 결제 단추를 잠근다', async () => {
  let release;
  api.quoteOrder.mockReturnValue(new Promise(r => { release = r; }));
  const h = renderHook(() => useCheckoutFlow(ITEMS, { user: USER }));
  await waitFor(() => expect(h.result.current.deliveryInfo?.zoneName).toBe('왕길권역'));
  expect(h.result.current.canPay).toBe(false);
  expect(h.result.current.quoteLoading).toBe(true);
  await act(async () => { release({ data: { ...QUOTE, lines: [{ id: 101, ok: true }, { id: 104, ok: false, error: '재고가 부족해요 (남은 수량: 0개)' }, { id: 105, ok: true }] } }); });
  await waitFor(() => expect(h.result.current.quoteLoading).toBe(false));
  expect(h.result.current.canPay).toBe(false);
  expect(h.result.current.quoteProblems).toEqual(['재고가 부족해요 (남은 수량: 0개)']);

  api.quoteOrder.mockRejectedValue({ response: { status: 500, data: { error: '금액을 계산하지 못했어요. 잠시 후 다시 시도해 주세요.' } } });
  const h2 = renderHook(() => useCheckoutFlow(ITEMS.slice(0, 1), { user: USER }));
  await waitFor(() => expect(h2.result.current.quoteError).toBeTruthy());
  expect(h2.result.current.canPay).toBe(false);
});

test('「행사 할인」 줄 — 주문서 결제 금액 칸과 주문 완료(영수증)에 같은 값', async () => {
  const { result } = await ready();
  const c = result.current;
  const { unmount } = render(<><PayRows c={c} /><PayBar c={c} onPay={() => {}} /></>);
  expect(screen.getByText('상품 금액').nextSibling.textContent).toBe('21,200원');
  expect(screen.getByText('행사 할인').nextSibling.textContent).toBe('−3,240원');
  expect(screen.getByRole('button', { name: '20,960원 결제하기' })).toBeEnabled();
  unmount();
  render(<Receipt order={{ id: 'order_1', date: '지금', status: '결제완료', items: ITEMS, totalPrice: c.finalPrice, summary: summaryOf(c) }} onClose={() => {}} onGoHome={() => {}} />);
  expect(screen.getByText('상품 금액').nextSibling.textContent).toBe('21,200원');
  expect(screen.getByText('행사 할인').nextSibling.textContent).toBe('−3,240원');
  expect(screen.getByText('총 결제금액').nextSibling.textContent).toBe('20,960원');
});

test('행사가 없으면 「행사 할인」 줄을 안 그린다', async () => {
  api.quoteOrder.mockResolvedValue({ data: { ...QUOTE, promo_discount: 0, subtotal: 21200, final_before_points: 24200 } });
  const { result } = await ready();
  render(<PayRows c={result.current} />);
  expect(screen.queryByText('행사 할인')).toBeNull();
});
