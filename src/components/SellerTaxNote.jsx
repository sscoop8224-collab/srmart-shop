// 판매자(동신마켓) 과세 유형 안내 — 부가세 한 줄 · 작은 안내 · 세금계산서 신청 단추 (2026-11-15 대표님 지시 3)
//
// 🔴 글은 **서버가 준 것만** 쓴다(srmart-backend src/services/sellerTax.js 의 TEXTS 한 곳). 화면에 따로 적지 않는다 —
//    세무사 답변으로 문구가 바뀌면 서버 한 곳만 고친다.
// 🔴 정보가 없으면(옛 서버 · 실패) **아무것도 그리지 않는다** — 세금계산서를 발급할 수 없는 때에 단추가 생기면 안 된다.
//    단추는 invoice_available 이 true 이고 단추 글이 있을 때만.
//   · 주문 상세: 주문에 적힌 **판매 당시** 유형(seller_tax) · 주문 완료: 지금 유형(GET /api/shop/seller-tax)
//   · 지키는 검사: scripts/check-seller-tax-ui.cjs
import { useState } from 'react';

export default function SellerTaxNote({ info }) {
  const [open, setOpen] = useState(false);
  if (!info || typeof info !== 'object' || !info.vat) return null;
  const canInvoice = info.invoice_available === true && !!info.invoice_button;
  return (
    <>
      <div className="kv" data-seller-tax={info.tax_type}><span>{info.vat.label}</span><span>{info.vat.text}</span></div>
      {!!info.note && <div className="spec" style={{ marginTop: 'var(--sp-1)', color: 'var(--text-2)', fontSize: 'var(--fs-sub)' }}>{info.note}</div>}
      {canInvoice && (
        <div style={{ marginTop: 'var(--sp-3)' }}>
          <button type="button" className="ui-btn sm line" onClick={() => setOpen(v => !v)} aria-expanded={open}>{info.invoice_button}</button>
          {open && !!info.invoice_guide && <div className="notice g" style={{ marginTop: 'var(--sp-2)' }}>{info.invoice_guide}</div>}
        </div>
      )}
    </>
  );
}
