// 판매자 과세 유형 안내(2026-11-15 지시 3) — 🔴 틀리면 손해가 큰 것:
//   · 세금계산서를 발급할 수 없는 때(간이 · 발급 불가)에 신청 단추가 보이면 — 손님은 받을 수 없는 것을 약속받는다.
//   · 정보를 못 받았는데(옛 서버 · 실패) 단추가 보이면 — 같은 일.
import { fireEvent, render, screen } from '@testing-library/react';
import SellerTaxNote from './SellerTaxNote';

const NO_INVOICE = {
  tax_type: 'simple_no_invoice', seller: '동신마켓', invoice_available: false,
  vat: { label: '부가세', text: '따로 표시하지 않아요' }, note: '판매자 동신마켓(간이과세자)는 세금계산서를 발급할 수 없어요.',
  invoice_button: null, invoice_guide: null,
};
const GENERAL = {
  tax_type: 'general', seller: '동신마켓', invoice_available: true,
  vat: { label: '부가세', text: '결제 금액에 포함' }, note: '판매자 동신마켓(일반과세자)',
  invoice_button: '세금계산서 신청', invoice_guide: '세금계산서는 고객센터로 신청해 주세요.',
};

test('정보가 없으면 아무것도 그리지 않는다', () => {
  const { container } = render(<SellerTaxNote info={null} />);
  expect(container).toBeEmptyDOMElement();
  const r2 = render(<SellerTaxNote info={{}} />);
  expect(r2.container).toBeEmptyDOMElement();
});

test('간이(발급 불가) — 부가세 줄과 안내는 보이고 신청 단추는 없다', () => {
  render(<SellerTaxNote info={NO_INVOICE} />);
  expect(screen.getByText('따로 표시하지 않아요')).toBeInTheDocument();
  expect(screen.getByText(/세금계산서를 발급할 수 없어요/)).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

test('발급 가능해도 invoice_available 이 false 면 단추를 숨긴다', () => {
  render(<SellerTaxNote info={{ ...GENERAL, invoice_available: false }} />);
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

test('일반과세 — 신청 단추를 누르면 서버가 준 안내가 열린다', () => {
  render(<SellerTaxNote info={GENERAL} />);
  expect(screen.getByText('결제 금액에 포함')).toBeInTheDocument();
  expect(screen.queryByText(/고객센터로 신청/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '세금계산서 신청' }));
  expect(screen.getByText(/고객센터로 신청/)).toBeInTheDocument();
});
