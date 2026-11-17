// 주문 보내기 · 거절 이유 (2026-11-17 밤샘 지시 6 — 주류 S51·S52 · 409 처리)
import { buildOrderRequest, orderErrorAction } from './orderSubmit';

const USER = { name: '손님', phone: '010-1111-2222', address: '인천 서구 왕길동 1', address_detail: '101호' };
const D = { fulfillment: 'delivery', zipcode: '22600', dong: '왕길동', address: '인천 서구 왕길로 1', addressDetail: '2층', receiverName: '김손님', receiverPhone: '010-9', use_points: 500, coupon_id: 81, coupon_code: null, items: [{ id: 101, quantity: 2 }] };
const P = { fulfillment: 'pickup', receiverName: '김손님', receiverPhone: '010-9', use_points: 0, coupon_id: null, coupon_code: null, items: [{ id: 900, quantity: 1 }] };

test('한 건 — 배송: 주소·동을 싣고 POST /orders', () => {
  const r = buildOrderRequest('order_1', 12000, D, USER);
  expect(r.path).toBe('/orders');
  expect(r.body).toMatchObject({ id: 'order_1', fulfillment: 'delivery', final_amount: 12000, dong: '왕길동', zipcode: '22600', use_points: 500, coupon_id: 81, items: D.items });
});

test('한 건 — 픽업(S51): 주소를 싣지 않는다', () => {
  const r = buildOrderRequest('order_2', 7800, P, USER);
  expect(r.path).toBe('/orders');
  expect(r.body.fulfillment).toBe('pickup');
  expect(r.body).not.toHaveProperty('address');
  expect(r.body).not.toHaveProperty('dong');
});

test('나눠 결제(S52) — 결제 한 번 · 주문 둘(-D · -P) · 합계를 final_amount 로', () => {
  const r = buildOrderRequest('order_3', 19800, { split: { delivery: D, pickup: P } }, USER);
  expect(r.path).toBe('/orders/checkout');
  expect(r.body.final_amount).toBe(19800);
  expect(r.body.orders.map(o => [o.id, o.fulfillment])).toEqual([['order_3-D', 'delivery'], ['order_3-P', 'pickup']]);
  expect(r.body.orders[0].coupon_id).toBe(81);          // 쿠폰은 배송 주문에만(서버: 두 주문 합쳐 한 장)
  expect(r.body.orders[1].coupon_id).toBeNull();
  expect(r.body.orders[1]).not.toHaveProperty('address');
  expect(r.body.orders[0].id.length).toBeLessThanOrEqual(50);   // orders.id VARCHAR(50)
});

const http = (status, data) => ({ response: { status, data } });
test.each([
  ['AMOUNT_MISMATCH', 409, { refresh: true }],
  ['SPLIT_REQUIRED', 409, { refresh: true }],
  ['PICKUP_REQUIRED', 409, { refresh: true }],
  ['ALCOHOL_ADULT_REQUIRED', 403, { verify: true }],
  ['ALCOHOL_NOT_SOLD', 400, { refresh: true }],
])('거절 %s → 할 일', (code, status, want) => {
  const a = orderErrorAction(http(status, { code, error: '서버 말' }));
  expect(a).toMatchObject(want);
  expect(a.title).toBeTruthy();
});

test('모르는 409 도 장바구니를 다시 확인 · 연결 끊김은 「결제는 되지 않았어요」', () => {
  expect(orderErrorAction(http(409, { error: '무언가' }))).toMatchObject({ message: '무언가', refresh: true });
  expect(orderErrorAction(new Error('Network Error')).message).toMatch(/결제는 되지 않았어요/);
});
