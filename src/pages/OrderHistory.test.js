// 주문내역(P01) 화면 확인 — 예전 구매 내역 시험(Purchases.test.js)이 지키던 것을 새 화면에서도 지킨다(묶음 4).
//
// 이 화면에서 틀리면 손해가 큰 것:
//   · **취소된 거래**가 취소로 안 보이면 — 손님이 폰을 내밀었을 때 계산원이 멀쩡한 영수증으로 읽고 환불을 또 해 줄 수 있다.
//   · **거래 바코드**가 틀리면 — 스캔해도 다른 거래가 열리거나 안 열린다.
//   · 온라인 카드의 **총 결제금액**이 할인 전 금액이면 — 손님이 낸 돈과 다르게 보인다(final_amount 를 쓴다).
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import OrderHistory from './OrderHistory';

jest.mock('../api', () => ({
  getMyPurchases: jest.fn(),
  getStorePurchase: jest.fn(),
  getOnlinePurchase: jest.fn(),
  requestReturn: jest.fn(),
  imgUrl: (x) => x,
}));
jest.mock('../DialogContext', () => ({ useDialog: () => ({ notify: jest.fn(), confirm: jest.fn() }) }));
const api = require('../api');

const ORDERS = [
  { id: 5, created_at: '2026-09-10T11:02:00', total_price: 48900, final_amount: 45900, status: '배송완료', return_status: '반려', return_type: '환불', return_message: '환불 요청이 반려됐어요.', return_note: '개봉 후 7일이 지났어요.' },
];
const LIST = {
  data: {
    store_visible: true,
    purchases: [
      { kind: 'store', id: 71, date: '2026-09-11T14:26:00', total: 1450, status: '취소', voided: true, is_return: false, store_name: '왕길점', item_summary: '농심/메론킥', code: 'T110000071' },
      { kind: 'online', id: 5, date: '2026-09-10T11:02:00', total: 45900, status: '배송완료', store_name: '검암점', item_summary: '콜라 외 5건' },
    ],
  },
};
const VOIDED_RECEIPT = {
  data: {
    kind: 'store', id: 71, code: 'T110000071', date: '2026-09-11T14:26:00', pos_number: '09',
    store: { name: '에스알마트 왕길점', display_name: '왕길점', business_number: '594-01-00220', address: '인천 검단구 단봉로 105', phone: '0325669949' },
    items: [{ name: '농심/메론킥', spec: '60g', qty: 1, unit_price: 1450, line_total: 1450, tax_type: '과세' }],
    subtotal: 1450, tax: 132, total: 1450, payment_method: 'cash',
    payments: [{ seq: 1, method: 'cash', amount: 1450, status: 'canceled', cash_received: 1450, change_amount: 0 }],
    earned_points: 0, points_balance: null, is_return: false, voided: true, voided_at: '2026-09-11T14:29:19',
  },
};

beforeEach(() => {
  api.getMyPurchases.mockResolvedValue(LIST);
  api.getStorePurchase.mockResolvedValue(VOIDED_RECEIPT);
});

test('전체 탭에 온라인 주문과 매장 구매가 함께 나오고, 온라인은 실제로 낸 돈(final_amount)을 보인다', async () => {
  render(<OrderHistory orders={ORDERS} />);
  expect(await screen.findByText(/매장 왕길점/)).toBeInTheDocument();
  expect(screen.getByText('콜라 외 5건')).toBeInTheDocument();
  expect(screen.getByText('45,900원')).toBeInTheDocument();
  expect(screen.queryByText('48,900원')).not.toBeInTheDocument();
});

test('환불 반려는 사유와 다시 요청하는 길을 같이 보인다', async () => {
  render(<OrderHistory orders={ORDERS} />);
  expect(await screen.findByText(/사유: 개봉 후 7일이 지났어요/)).toBeInTheDocument();
  expect(screen.getByText(/다시 요청하시려면/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '환불 요청' })).toBeInTheDocument();
});

test('미동의 회원에게는 매장 탭에 동의 안내가 나온다', async () => {
  api.getMyPurchases.mockResolvedValue({ data: { store_visible: false, purchases: [] } });
  render(<OrderHistory orders={[]} onOpenConsent={() => {}} />);
  fireEvent.click(await screen.findByRole('tab', { name: '매장' }));
  expect(await screen.findByText(/매장에서 사신 내역은 아직 안 보여요/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '동의하고 매장 내역 보기' })).toBeInTheDocument();
});

test('취소된 거래는 상단에 크게 취소로 표시되고 도장이 얹힌다', async () => {
  // 알림을 눌러 들어온 길(openSaleId)로 바로 연다
  render(<OrderHistory orders={[]} openSaleId={71} />);
  await waitFor(() => expect(api.getStorePurchase).toHaveBeenCalledWith(71));

  expect(await screen.findByText('취소된 거래')).toBeInTheDocument();
  expect(screen.getByText('결제 효력 없음')).toBeInTheDocument();
  expect(screen.getByText(/취소 2026\.09\.11 14:29/)).toBeInTheDocument();
  expect(screen.getByText('취소됨')).toBeInTheDocument();
  // 취소돼도 결제 내역은 남는다
  expect(screen.getByText('현금 (취소됨)')).toBeInTheDocument();
  // 거래 바코드 — 값이 코드와 같고, 사람이 읽는 숫자도 같이 있다
  expect(screen.getByRole('img', { name: '거래 바코드 T110000071' })).toBeInTheDocument();
  expect(screen.getByText('T110000071')).toBeInTheDocument();
});

test('CODE128 심볼이 규격대로 그려진다', async () => {
  render(<OrderHistory orders={[]} openSaleId={71} />);
  const svg = await screen.findByRole('img', { name: '거래 바코드 T110000071' });
  expect(svg.getAttribute('viewBox')).toBe('0 0 165 96');
  expect(svg.querySelectorAll('rect').length).toBe(1 + 40);
});

// 매장 픽업(주류) — 서버가 정한 기한을 날짜로, 찾아간 뒤에는 그 날짜로(2026-11-17 낮 지시 5). 앱이 기한을 계산하지 않는다.
test('픽업 주문 카드에 찾아가는 기한, 찾아간 주문에는 「찾아가셨어요」', async () => {
  const PICK = [
    { id: 'P1-P', created_at: '2026-11-17T10:00:00', total_price: 3900, final_amount: 3900, status: '결제완료', fulfillment_type: 'pickup', pickup_deadline: '2026-11-20 23:59:59', picked_up_at: null },
    { id: 'P2-P', created_at: '2026-11-15T10:00:00', total_price: 3900, final_amount: 3900, status: '결제완료', fulfillment_type: 'pickup', pickup_deadline: '2026-11-18 23:59:59', picked_up_at: '2026-11-16T18:20:00' },
    { id: 'D1', created_at: '2026-11-14T10:00:00', total_price: 5900, final_amount: 5900, status: '배송중', fulfillment_type: 'delivery', pickup_deadline: null },
  ];
  render(<OrderHistory orders={PICK} />);
  expect(await screen.findByText(/매장 픽업 · 11월 20일\(금\)까지 찾아가 주세요/)).toBeInTheDocument();
  expect(screen.getByText(/매장 픽업 · 11월 16일 찾아가셨어요/)).toBeInTheDocument();
  expect(screen.getAllByText(/매장 픽업 ·/).length).toBe(2);   // 배송 주문에는 안 붙는다
});

// 매장 영수증 세금 줄 — 종이 영수증(receiptFormat.ts)과 같은 줄·숫자(2026-11-17 낮 지시 5)
test('매장 영수증에 과세 물품가액 · 부가세 — 면세 품목이 없으면 면세 줄은 없다', async () => {
  render(<OrderHistory orders={[]} openSaleId={71} />);
  expect(await screen.findByText('과세 물품가액')).toBeInTheDocument();
  expect(screen.getByText('1,318원')).toBeInTheDocument();   // 1,450 − 132
  expect(screen.getByText('부가세')).toBeInTheDocument();
  expect(screen.queryByText('면세 물품가액')).not.toBeInTheDocument();
  expect(screen.queryByText('부가세(포함)')).not.toBeInTheDocument();
});

// 온라인 카드 품목 줄 — 주문 줄에 items 가 있을 때만(지금 서버 목록엔 없다 → 요약 한 줄) · 2026-11-17 낮 지시 5
test('주문 줄에 품목이 있으면 앞 두 개 + 「외 N건」, 없으면 요약 한 줄', async () => {
  const O = [
    { id: 'I1', created_at: '2026-11-16T10:00:00', total_price: 9000, final_amount: 9000, status: '배송중', items: [
      { product_name: '코카콜라', spec: '1.5L', quantity: 2, price: 3200 },
      { name: '농심 메론킥', spec: '60g', qty: 1, line_total: 1450 },
      { name: '신라면', qty: 1, line_total: 1150 },
    ] },
  ];
  render(<OrderHistory orders={O} />);
  expect(await screen.findByText('코카콜라')).toBeInTheDocument();
  expect(screen.getByText('6,400원')).toBeInTheDocument();          // 3,200 × 2 — 서버가 준 단가 × 수량
  expect(screen.getByText('농심 메론킥')).toBeInTheDocument();
  expect(screen.queryByText('신라면')).not.toBeInTheDocument();
  expect(screen.getByText('외 1건')).toBeInTheDocument();
});
