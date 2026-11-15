#!/usr/bin/env node
/**
 * 판매자 과세 유형 화면 검사 (2026-11-15 대표님 지시 3·5) — prebuild
 *
 *   node scripts/check-seller-tax-ui.cjs        # 검사(자가 시험 먼저)
 *
 * 보는 것
 *  ① SellerTaxNote 가 정보가 없으면 아무것도 그리지 않고(null), 단추는 invoice_available === true 이고 단추 글이 있을 때만 그린다
 *  ② 손님 문구(부가세 · 세금계산서)를 화면 코드에 따로 적지 않는다 — 서버(sellerTax.js TEXTS) 한 곳. 화면은 info.* 만 쓴다
 *  ③ 온라인 주문 상세(OrderHistory OnlineDetail)는 **주문에 적힌** seller_tax 를 쓴다(지금 유형이 아니라)
 *  ④ 주문 완료(Receipt)는 getSellerTax 를 부르고, 실패하면 null 그대로 둔다(catch 에서 값을 지어내지 않는다)
 *  ⑤ api.js 에 getSellerTax = GET /shop/seller-tax
 * 🔴 POS 매장 영수증(Purchases · OrderHistory StoreReceipt)의 「부가세(포함)」은 그 매장 사업자 것이라 이 검사 대상이 아니다.
 * 종료코드: 0 통과 · 1 실패
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const R = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// 화면에 박으면 안 되는 손님 문구(서버 TEXTS 에만 있어야 한다)
const SERVER_ONLY = ['세금계산서 신청', '세금계산서를 발급할 수 없어요', '따로 표시하지 않아요', '결제 금액에 포함', '고객센터로 신청'];

function checkNote(src) {
  const out = [];
  if (!/if\s*\(\s*!info\b[^)]*\)\s*return null/.test(src)) out.push('SellerTaxNote: 정보가 없을 때 return null 이 없다');
  if (!/info\.invoice_available\s*===\s*true/.test(src)) out.push('SellerTaxNote: 단추 조건이 invoice_available === true 가 아니다');
  if (!/!!info\.invoice_button/.test(src)) out.push('SellerTaxNote: 단추 글(invoice_button)이 없을 때도 단추를 그린다');
  if (!/\{canInvoice && /.test(src)) out.push('SellerTaxNote: 단추가 canInvoice 로 감싸여 있지 않다');
  return out;
}
function checkHardcoded(files) {
  const out = [];
  for (const [name, src] of Object.entries(files)) {
    const code = src.split(/\r?\n/).filter(l => !/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(l)).join('\n');
    for (const t of SERVER_ONLY) if (code.includes(t)) out.push(`${name}: 손님 문구 「${t}」 를 화면에 적었다 — 서버 sellerTax.js TEXTS 한 곳에서만`);
  }
  return out;
}
function checkOrderHistory(src) {
  const out = [];
  const i = src.indexOf('function OnlineDetail');
  const body = i >= 0 ? src.slice(i, src.indexOf('\nfunction ', i + 10) > 0 ? src.indexOf('\nfunction ', i + 10) : undefined) : '';
  if (!body) out.push('OrderHistory: OnlineDetail 을 못 찾았다');
  else if (!/<SellerTaxNote info=\{d\.seller_tax\}/.test(body)) out.push('OrderHistory OnlineDetail: 주문의 seller_tax 로 SellerTaxNote 를 그리지 않는다');
  if (/getSellerTax/.test(src)) out.push('OrderHistory: 지금 유형(getSellerTax)을 부른다 — 주문 상세는 판매 당시 유형(d.seller_tax)만');
  return out;
}
function checkReceipt(src) {
  const out = [];
  if (!/getSellerTax\(\)/.test(src)) out.push('Receipt: getSellerTax() 를 부르지 않는다');
  if (!/useState\(null\)/.test(src)) out.push('Receipt: 과세 정보의 처음 값이 null 이 아니다');
  if (!/\.catch\(\(\)\s*=>\s*\{\s*\}\)/.test(src)) out.push('Receipt: 실패를 조용히 넘기지 않는다(.catch(() => {}) — 값을 지어내면 안 된다)');
  if (!/<SellerTaxNote info=\{sellerTax\}/.test(src)) out.push('Receipt: SellerTaxNote 를 그리지 않는다');
  return out;
}
function checkApi(src) {
  return /export const getSellerTax = \(\) => API\.get\('\/shop\/seller-tax'\)/.test(src) ? [] : ['api.js: getSellerTax = GET /shop/seller-tax 가 없다'];
}

// ── 자가 시험 — 일부러 틀린 것을 넣어 잡히는지 ──────────────────────────
function selfTest() {
  const good = "if (!info || typeof info !== 'object' || !info.vat) return null;\nconst canInvoice = info.invoice_available === true && !!info.invoice_button;\n{canInvoice && (<b/>)}";
  const cases = [
    ['좋은 컴포넌트는 통과', checkNote(good).length === 0],
    ['null 거르기 없음 → 잡힘', checkNote(good.replace(/return null/, 'return <i/>')).length > 0],
    ['단추 조건 truthy → 잡힘', checkNote(good.replace('=== true', '')).length > 0],
    ['단추 글 확인 없음 → 잡힘', checkNote(good.replace('&& !!info.invoice_button', '')).length > 0],
    ['화면에 문구 박음 → 잡힘', checkHardcoded({ x: "<button>세금계산서 신청</button>" }).length > 0],
    ['주석 속 문구는 통과', checkHardcoded({ x: "// 세금계산서 신청 단추는 서버 글" }).length === 0],
    ['상세가 지금 유형을 씀 → 잡힘', checkOrderHistory("function OnlineDetail(){ getSellerTax(); <SellerTaxNote info={d.seller_tax} /> }\nfunction X(){}").length > 0],
    ['상세가 주문 값을 씀 → 통과', checkOrderHistory("function OnlineDetail(){ <SellerTaxNote info={d.seller_tax} /> }\nfunction X(){}").length === 0],
    ['완료 화면이 실패 때 값을 지어냄 → 잡힘', checkReceipt("useState(null); getSellerTax().then(a).catch(() => setX({ invoice_available: true })); <SellerTaxNote info={sellerTax} />").length > 0],
    ['api 없음 → 잡힘', checkApi('').length > 0],
  ];
  const bad = cases.filter(([, ok]) => !ok);
  for (const [n, ok] of cases) console.log(`  ${ok ? '✅' : '🔴'} 자가 시험: ${n}`);
  return bad.length === 0;
}

function main() {
  console.log('판매자 과세 유형 화면 검사 (scripts/check-seller-tax-ui.cjs)');
  if (!selfTest()) { console.error('🔴 자가 시험 실패 — 검사기를 믿을 수 없다'); process.exit(1); }
  const note = R('src/components/SellerTaxNote.jsx');
  const oh = R('src/pages/OrderHistory.jsx');
  const rc = R('src/pages/Receipt.js');
  const problems = [
    ...checkNote(note),
    ...checkHardcoded({ 'SellerTaxNote.jsx': note, 'OrderHistory.jsx': oh, 'Receipt.js': rc }),
    ...checkOrderHistory(oh), ...checkReceipt(rc), ...checkApi(R('src/api.js')),
  ];
  if (problems.length) { for (const p of problems) console.error(`  🔴 ${p}`); process.exit(1); }
  console.log('  ✅ 통과 — 정보 없으면 안 그림 · 단추는 발급 가능할 때만 · 문구는 서버 한 곳 · 주문 상세는 판매 당시 유형');
}
if (require.main === module) main();
module.exports = { checkNote, checkHardcoded, checkOrderHistory, checkReceipt, checkApi };
