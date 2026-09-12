// 구매 내역 화면 확인 — 취소 표시와 거래 바코드가 실제로 그려지는지.
//
// 브라우저 없이 확인해야 해서 렌더까지 돌린다. 이 화면에서 틀리면 손해가 큰 것 둘을 본다:
//   · **취소된 거래**가 취소로 안 보이면 — 손님이 폰을 내밀었을 때 계산원이 멀쩡한
//     영수증으로 읽고 환불을 또 해 줄 수 있다.
//   · **거래 바코드**가 틀리면 — 스캔해도 다른 거래가 열리거나 안 열린다.
import { render, screen, waitFor } from '@testing-library/react';
import Purchases from './Purchases';

jest.mock('../api', () => ({
  getMyPurchases: jest.fn(),
  getStorePurchase: jest.fn(),
  getOnlinePurchase: jest.fn(),
}));
const api = require('../api');

const LIST = {
  data: {
    store_visible: true,
    purchases: [
      {
        kind: 'store', id: 71, date: '2026-09-11T14:26:00', total: 1450, status: '취소',
        voided: true, is_return: false, store_name: '왕길점', item_summary: '농심/메론킥',
        code: 'T110000071',
      },
      {
        kind: 'online', id: 5, date: '2026-09-10T11:02:00', total: 45900, status: '배송완료',
        store_name: '검암점', item_summary: '콜라 외 5건',
      },
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
    earned_points: 0, points_balance: null,
    is_return: false, voided: true, voided_at: '2026-09-11T14:29:19',
  },
};

beforeEach(() => {
  api.getMyPurchases.mockResolvedValue(LIST);
  api.getStorePurchase.mockResolvedValue(VOIDED_RECEIPT);
});

test('목록에 매장 구매와 온라인 주문이 함께 나온다', async () => {
  render(<Purchases goBack={() => {}} />);
  expect(await screen.findByText('왕길점')).toBeInTheDocument();
  expect(screen.getByText('온라인 주문')).toBeInTheDocument();
  expect(screen.getByText('농심/메론킥')).toBeInTheDocument();
  expect(screen.getByText('₩45,900')).toBeInTheDocument();
});

test('미동의 회원에게는 매장 구매 대신 동의 안내가 나온다', async () => {
  api.getMyPurchases.mockResolvedValue({ data: { store_visible: false, purchases: [] } });
  render(<Purchases goBack={() => {}} onOpenConsent={() => {}} />);
  expect(await screen.findByText(/매장에서 사신 내역은 아직 안 보여요/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '동의하고 매장 내역 보기' })).toBeInTheDocument();
});

test('취소된 거래는 상단에 크게 취소로 표시되고 바코드에 워터마크가 얹힌다', async () => {
  // 알림을 탭해 들어온 경로(openSaleId) 로 바로 상세를 연다.
  render(<Purchases goBack={() => {}} openSaleId={71} />);

  await waitFor(() => expect(api.getStorePurchase).toHaveBeenCalledWith(71));

  // 맨 위 배너 — 손님이 폰을 내밀었을 때 계산원이 한눈에 알아야 하는 것
  expect(await screen.findByText('취소된 거래')).toBeInTheDocument();
  expect(screen.getByText('결제 효력 없음')).toBeInTheDocument();
  expect(screen.getByText(/취소 2026\.09\.11 14:29/)).toBeInTheDocument();
  expect(screen.getByText('취소됨')).toBeInTheDocument();       // 바코드 위 워터마크

  // 취소돼도 결제 내역은 남아야 한다 — 손님이 보려는 게 "무엇으로 결제했었나" 다
  expect(screen.getByText('현금 (취소됨)')).toBeInTheDocument();

  // 거래 바코드 — 값이 코드와 같고, 사람이 읽는 숫자도 같이 있다
  const svg = screen.getByRole('img', { name: '거래 바코드 T110000071' });
  expect(svg).toBeInTheDocument();
  expect(screen.getByText('T110000071')).toBeInTheDocument();
});

test('CODE128 심볼이 규격대로 그려진다', async () => {
  render(<Purchases goBack={() => {}} openSaleId={71} />);
  const svg = await screen.findByRole('img', { name: '거래 바코드 T110000071' });

  // 문자 10개 → 시작 + 10 + 체크 + 정지 = 13심볼. 모듈 폭은 12×11 + 13 = 145.
  // 여기에 좌우 여백(10모듈씩)을 더한 165 가 viewBox 폭이어야 한다.
  expect(svg.getAttribute('viewBox')).toBe('0 0 165 96');

  // 막대(rect)는 심볼당 3개 + 정지문자 4개 = 40개. 흰 바탕 rect 1개가 더 있다.
  const rects = svg.querySelectorAll('rect');
  expect(rects.length).toBe(1 + 40);
});
