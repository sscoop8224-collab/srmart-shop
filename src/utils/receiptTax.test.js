// 매장 영수증 세금 줄 — 종이(receiptFormat.ts)와 같은 공식 (개발 표 #22 · 2026-11-17 낮 지시 5)
import { receiptTaxLines } from './receiptTax';

const it = (tax_type, line_total) => ({ tax_type, line_total });

test('섞인 거래 — 과세 물품가액 · 부가세 · 면세 물품가액', () => {
  // 과세 11,000(부가세 1,000) + 면세 3,000
  expect(receiptTaxLines({ items: [it('과세', 5500), it('과세', 5500), it('면세', 3000)], tax: 1000 })).toEqual([
    { label: '과세 물품가액', amount: 10000 }, { label: '부가세', amount: 1000 }, { label: '면세 물품가액', amount: 3000 },
  ]);
});

test('과세만 · 면세만 — 없는 쪽 줄은 그리지 않는다', () => {
  expect(receiptTaxLines({ items: [it('과세', 1450)], tax: 132 }).map(x => x.label)).toEqual(['과세 물품가액', '부가세']);
  expect(receiptTaxLines({ items: [it('면세', 6400)], tax: 0 })).toEqual([{ label: '면세 물품가액', amount: 6400 }]);
});

test('과세 구분이 없는 옛 자료 → null(화면은 예전 한 줄)', () => {
  expect(receiptTaxLines({ items: [{ line_total: 1000 }], tax: 91 })).toBeNull();
  expect(receiptTaxLines({})).toBeNull();
});
