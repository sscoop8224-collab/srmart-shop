// 매장 영수증의 세금 줄 — 종이 영수증과 같은 줄·같은 숫자 (개발 표 #22 · 2026-11-17 낮 지시 5)
//
//   🔴 공식은 POS 종이 영수증 그대로다: srmart-pos/src/hal/printer/receiptFormat.ts 457~478행
//     과세 물품가액 = 과세 품목 줄 합계 − 부가세(서버 tax — 과세 품목에서만 쌓인 값)
//     부가세       = 서버 tax
//     면세 물품가액 = 면세 품목 줄 합계
//   해당 품목이 있을 때만 그 줄을 그린다(과세만 · 면세만 · 섞임 — 종이와 같다). 0원 줄로 헷갈리게 하지 않는다.
//   서버 자료: GET /api/me/purchases/store/:id 의 items[].tax_type · line_total · tax — 앱이 지어내는 숫자는 없다.
//   품목에 과세 구분이 하나도 없으면(옛 자료) null — 화면은 예전처럼 「부가세(포함)」 한 줄.
export function receiptTaxLines(d) {
  const items = Array.isArray(d && d.items) ? d.items : [];
  const hasTaxable = items.some(i => i.tax_type === '과세');
  const hasTaxFree = items.some(i => i.tax_type === '면세');
  if (!hasTaxable && !hasTaxFree) return null;
  const sum = (t) => items.filter(i => i.tax_type === t).reduce((s, i) => s + (Number(i.line_total) || 0), 0);
  const tax = Number(d.tax) || 0;
  const out = [];
  if (hasTaxable) {
    out.push({ label: '과세 물품가액', amount: sum('과세') - tax });
    out.push({ label: '부가세', amount: tax });
  }
  if (hasTaxFree) out.push({ label: '면세 물품가액', amount: sum('면세') });
  return out;
}
