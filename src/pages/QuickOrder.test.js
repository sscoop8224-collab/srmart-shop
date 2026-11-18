// 주문서 — 배송·픽업 나눔 (목업 S51·S52 · 2026-11-17 밤샘 지시 6)
//   · 나누는 기준은 줄의 pickup_only(서버 판정) 하나다.
//   · 섞이면 견적을 두 번(배송 · fulfillment:'pickup') 받고, 결제 금액은 둘의 합 · 결제는 한 번(onPayment 에 split).
//   · 픽업만이면 주소를 묻지 않는다.
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import OrderSheet from './QuickOrder';

jest.mock('../api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
  matchZipcode: jest.fn(), getMyPoints: jest.fn(), getMyActiveCoupons: jest.fn(), quoteOrder: jest.fn(), imgUrl: (p) => p,
}));
jest.mock('../DialogContext', () => ({ useDialog: () => ({ notify: jest.fn(), confirm: jest.fn() }) }));
jest.mock('../StoreContext', () => ({ useStore: () => ({ currentStoreId: 11, isOwner: false, currentStore: { id: 11, name: '에스알마트 왕길점' } }) }));
jest.mock('../hooks/usePublishBottomBarHeight', () => () => {});
const api = require('../api');

const USER = { id: 7, name: '손님', phone: '010-1111-2222', address: '인천 서구 왕길동 1', zipcode: '22600', dong_name: '왕길동' };
const SNACK = { id: 101, name: '메론킥', price: 1450, quantity: 2, pricing_type: 'unit' };
const SOJU = { id: 900, name: '참이슬 후레쉬 360ml', price: 1950, quantity: 2, pricing_type: 'unit', pickup_only: true };
const quote = (body) => body.fulfillment === 'pickup'
  ? { lines: [{ id: 900, ok: true }], gross: 3900, promo_discount: 0, subtotal: 3900, coupon_discount: 0, coupon_error: null, delivery_fee: 0, free_delivery_min: 0, out_of_zone: false, final_before_points: 3900 }
  : { lines: [{ id: 101, ok: true }], gross: 2900, promo_discount: 0, subtotal: 2900, coupon_discount: 0, coupon_error: null, delivery_fee: 3000, free_delivery_min: 30000, out_of_zone: false, final_before_points: 5900 };

beforeEach(() => {
  jest.clearAllMocks();
  api.getMyPoints.mockResolvedValue({ data: { points: 0 } });
  api.getMyActiveCoupons.mockResolvedValue({ data: [] });
  api.matchZipcode.mockResolvedValue({ data: { matched: true, zone: { zone_name: '왕길권역', free_delivery_min: 30000 }, delivery_fee: 3000 } });
  api.quoteOrder.mockImplementation(async (body) => ({ data: quote(body) }));
});

test('섞인 주문서 — 두 묶음 · 견적 두 번 · 결제 한 번(합계)', async () => {
  const onPayment = jest.fn();
  render(<OrderSheet items={[SNACK, SOJU]} user={USER} onPayment={onPayment} onBack={() => {}} />);
  expect(screen.getByText(/주문이 두 개로 나뉘어요/)).toBeInTheDocument();
  expect(screen.getByText(/배송 주문 · 1개/)).toBeInTheDocument();
  expect(screen.getByText(/매장 픽업 주문 · 1개/)).toBeInTheDocument();
  expect(screen.getByText('에스알마트 왕길점')).toBeInTheDocument();
  const btn = await screen.findByRole('button', { name: '9,800원 결제하기' });   // 5,900 + 3,900
  await waitFor(() => expect(btn).not.toBeDisabled());
  // 묶음마다 견적을 받는다 — 횟수는 보지 않는다: 배송지 확인(matchedDong)이 첫 견적보다 늦게 오면 질문이 바뀌어 배송 견적을
  // 한 번 더 받는다(전체 시험을 한꺼번에 돌릴 때 실제로 그랬다 · 2026-11-17). 화면은 질문이 맞는 견적(quoteFresh)만 쓴다.
  const kinds = [...new Set(api.quoteOrder.mock.calls.map(([b]) => b.fulfillment || 'delivery'))].sort();
  expect(kinds).toEqual(['delivery', 'pickup']);
  fireEvent.click(btn);
  const [total, extras] = onPayment.mock.calls[0];
  expect(total).toBe(9800);
  expect(extras.split.delivery).toMatchObject({ fulfillment: 'delivery', dong: '왕길동', items: [{ id: 101 }] });
  expect(extras.split.pickup).toMatchObject({ fulfillment: 'pickup', items: [{ id: 900 }] });
  expect(extras.split.pickup).not.toHaveProperty('dong');
  expect(extras.amounts).toEqual({ delivery: 5900, pickup: 3900 });
});

test('픽업만 — 주소를 묻지 않고 배송비 줄이 없다', async () => {
  const onPayment = jest.fn();
  render(<OrderSheet items={[SOJU]} user={{ ...USER, zipcode: '' }} onPayment={onPayment} onBack={() => {}} />);
  const btn = await screen.findByRole('button', { name: '3,900원 결제하기' });
  await waitFor(() => expect(btn).not.toBeDisabled());
  expect(screen.queryByText('배송비')).toBeNull();
  expect(api.matchZipcode).not.toHaveBeenCalled();
  fireEvent.click(btn);
  expect(onPayment.mock.calls[0][1]).toMatchObject({ fulfillment: 'pickup', items: [{ id: 900 }] });
});

test('배송만 — 예전 그대로(픽업 묶음 없음)', async () => {
  render(<OrderSheet items={[SNACK]} user={USER} onPayment={jest.fn()} onBack={() => {}} />);
  await screen.findByRole('button', { name: '5,900원 결제하기' });
  expect(screen.queryByText(/매장 픽업/)).toBeNull();
  expect(api.quoteOrder.mock.calls.every(([b]) => !b.fulfillment)).toBe(true);
});
