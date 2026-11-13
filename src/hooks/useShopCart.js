// 장바구니 저장소 (2026-11-13 대표님 지시 — 서버 장바구니) · 목업 S08A · 서버 src/services/shopCart.js
//
//   · 회원 → 서버(회원 계정)에 저장. 폰을 바꾸거나 앱을 다시 깔아도, 다른 기기로 로그인해도 같은 장바구니.
//     담기·수량·빼기·비우기를 그때그때 서버에 쓰고, 서버가 돌려준 장바구니(다시 확인한 결과)를 그대로 그린다.
//   · 비회원 → 이 기기(localStorage)에만. 화면에 보일 때는 서버 미리보기(/shop/cart/preview)로 같은 판정을 받는다.
//   · 로그인하는 순간 기기 장바구니를 서버로 합치고(같은 상품·같은 포장 단위는 수량을 더함 · 상한 99), **성공한 뒤에만** 기기 쪽을 비운다.
//   · 줄은 (상품, 포장 단위) 로 하나 — 같은 상품의 박스와 낱개는 다른 줄이다(예전엔 상품 번호로만 묶어 섞였다).
//   · 금액은 서버 값만 쓴다. 화면에서 다시 계산하지 않는다.
import { useCallback, useEffect, useRef, useState } from 'react';
import { getCart, previewCart, putCartLine, deleteCartLine, clearCartApi, mergeCart } from '../api';

// 브랜드 앱이 나뉘기 전까지는 에스알마트 하나(서버도 헤더가 없으면 매장의 브랜드를 따른다).
const BRAND = 'srm';
export const GUEST_KEY = `srm_cart_v1:${BRAND}`;
export const CART_MAX_QTY = 99;

/** 상품(목록·상세에서 넘어온 모양) → 장바구니 줄 */
export function lineFromProduct(p, qty = 1) {
  const unit_type = p.pricing_type === 'weight' ? 'weight' : p.purchase_type === 'box' ? 'box' : 'unit';
  return {
    product_id: Number(p.id), unit_type,
    quantity: unit_type === 'weight' ? 1 : Math.max(1, Math.min(CART_MAX_QTY, Number(qty) || 1)),
    grams: unit_type === 'weight' ? Number(p.grams) || 100 : null,
  };
}
const keyOf = (l) => `${l.product_id}:${l.unit_type}`;

function readGuest() {
  try { const v = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (_) { return []; }
}
function writeGuest(lines) {
  try { if (lines.length) localStorage.setItem(GUEST_KEY, JSON.stringify(lines)); else localStorage.removeItem(GUEST_KEY); } catch (_) { /* 저장 못 해도 화면은 계속 */ }
}

/** 기기 줄에 더한다 — 서버 합치기와 같은 규칙(같은 상품·같은 단위는 더하고 상한). */
export function addGuestLine(lines, add, { snapshot = null, unitPrice = null } = {}) {
  const k = keyOf(add);
  const i = lines.findIndex(l => keyOf(l) === k);
  if (i < 0) return [...lines, { ...add, added_unit_price: unitPrice, added_at: new Date().toISOString(), snapshot }];
  const cur = lines[i];
  const next = add.unit_type === 'weight'
    ? { ...cur, grams: Math.min(20000, (Number(cur.grams) || 0) + (Number(add.grams) || 0)) }
    : { ...cur, quantity: Math.min(CART_MAX_QTY, (Number(cur.quantity) || 0) + (Number(add.quantity) || 0)) };
  return lines.map((l, j) => (j === i ? next : l));
}

const EMPTY = { lines: [], subtotal: 0, gross: 0, promo_discount: 0, ok_count: 0, problem_count: 0, store: null };

/**
 * @param {{ user: object|null, storeId: number|null, onMerged?: (n:number)=>void }} opt
 */
export default function useShopCart({ user, storeId, onMerged }) {
  const member = !!user;
  const [guest, setGuest] = useState(readGuest);       // 비회원 기기 줄(원본)
  const [view, setView] = useState(EMPTY);              // 서버가 다시 확인한 장바구니(그대로 그린다)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [storeNotice, setStoreNotice] = useState(null);   // 「○○점 기준으로 다시 확인했어요」
  const seq = useRef(0);
  const lastStore = useRef(null);
  const mergedFor = useRef(null);

  const accept = useCallback((data, mySeq) => {
    if (mySeq !== seq.current) return;    // 더 늦게 보낸 요청의 답이 이미 왔다 — 옛 답으로 덮지 않는다
    const sid = data && data.store ? data.store.id : null;
    if (lastStore.current != null && sid != null && lastStore.current !== sid) setStoreNotice(data.store.name || null);
    if (sid != null) lastStore.current = sid;
    setView({ ...EMPTY, ...data });
    setError(null);
  }, []);

  const failMsg = (e, fb) => e?.response?.data?.error || fb;

  /** 서버에서 다시 확인한다(장바구니 화면을 열 때 · 매장이 바뀔 때). */
  const refresh = useCallback(async () => {
    const my = ++seq.current;
    setLoading(true);
    try {
      if (member) accept((await getCart()).data, my);
      else if (guest.length && storeId) accept((await previewCart(storeId, guest)).data, my);
      else if (my === seq.current) setView(EMPTY);
    } catch (e) {
      if (my === seq.current) setError(failMsg(e, '장바구니를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.'));
    } finally { if (my === seq.current) setLoading(false); }
  }, [member, guest, storeId, accept]);

  // 비회원 줄이 바뀌면 기기에 저장
  useEffect(() => { writeGuest(guest); }, [guest]);

  // 🔴 로그인하는 순간 — 기기 장바구니를 서버로 합친다. 성공한 뒤에만 비운다(실패하면 다음에 다시).
  useEffect(() => {
    if (!member) { mergedFor.current = null; return; }
    const uid = user.id ?? user.email;
    if (mergedFor.current === uid) return;
    mergedFor.current = uid;
    const local = readGuest();
    (async () => {
      const my = ++seq.current;
      try {
        if (local.length) {
          const res = await mergeCart(local.map(({ snapshot, ...l }) => l));
          setGuest([]); writeGuest([]);
          accept(res.data, my);
          const n = (res.data.merged?.added || 0) + (res.data.merged?.summed || 0);
          if (n && onMerged) onMerged(n, res.data.merged);
        } else accept((await getCart()).data, my);
      } catch (e) {
        mergedFor.current = null;   // 다음 기회에 다시 합친다(기기 줄은 그대로 있다)
        if (my === seq.current) setError(failMsg(e, '장바구니를 불러오지 못했어요.'));
      }
    })();
  }, [member, user, accept, onMerged]);

  // 로그아웃하면 화면에서 회원 장바구니를 지운다(서버에는 남는다)
  useEffect(() => { if (!member) { setView(EMPTY); lastStore.current = null; } }, [member]);

  // 매장이 바뀌면 다시 확인
  useEffect(() => { if (storeId) refresh(); }, [storeId]);   // eslint-disable-line react-hooks/exhaustive-deps

  /** 담기 — 성공하면 null, 막히면 이유(서버 말 그대로). */
  const add = useCallback(async (product, qty = 1) => {
    const line = lineFromProduct(product, qty);
    if (!member) {
      const snap = { name: product.name, spec: product.spec, image: product.image, large: product.large };
      const unitPrice = product.purchase_type === 'box' ? Number(product.price) : Number(product.unit_price ?? product.price);
      setGuest(g => addGuestLine(g, line, { snapshot: snap, unitPrice: Number.isFinite(unitPrice) ? unitPrice : null }));
      return null;
    }
    const my = ++seq.current;
    try { accept((await putCartLine({ ...line, mode: 'add' })).data, my); return null; }
    catch (e) { return failMsg(e, '장바구니에 담지 못했어요. 잠시 후 다시 시도해 주세요.'); }
  }, [member, accept]);

  /** 수량·무게 바꾸기(그 값으로). l = 화면의 줄(view.lines 의 하나) */
  const setQty = useCallback(async (l, { quantity, grams }) => {
    const next = { product_id: l.product_id, unit_type: l.unit_type, quantity: quantity ?? l.quantity, grams: grams ?? l.grams };
    if (!member) {
      setGuest(g => g.map(x => (keyOf(x) === keyOf(next) ? { ...x, quantity: next.quantity, grams: next.grams } : x)));
      setView(v => ({ ...v, lines: v.lines.map(x => (keyOf(x) === keyOf(next) ? { ...x, ...next } : x)) }));   // 금액은 미리보기가 다시 낸다
      return null;
    }
    const my = ++seq.current;
    try { accept((await putCartLine({ ...next, mode: 'set' })).data, my); return null; }
    catch (e) { return failMsg(e, '수량을 바꾸지 못했어요.'); }
  }, [member, accept]);

  const remove = useCallback(async (l) => {
    if (!member) {
      setGuest(g => g.filter(x => keyOf(x) !== keyOf(l)));
      setView(v => ({ ...v, lines: v.lines.filter(x => keyOf(x) !== keyOf(l)) }));
      return null;
    }
    const my = ++seq.current;
    try { accept((await deleteCartLine(l.id)).data, my); return null; }
    catch (e) { return failMsg(e, '빼지 못했어요.'); }
  }, [member, accept]);

  /** 여러 줄 빼기(살 수 없는 상품 빼기) */
  const removeMany = useCallback(async (ls) => {
    for (const l of ls) {
      const err = await remove(l);   // eslint-disable-line no-await-in-loop
      if (err) return err;
    }
    return null;
  }, [remove]);

  const clear = useCallback(async () => {
    if (!member) { setGuest([]); setView(EMPTY); return null; }
    const my = ++seq.current;
    try { accept((await clearCartApi()).data, my); return null; }
    catch (e) { return failMsg(e, '비우지 못했어요.'); }
  }, [member, accept]);

  // 비회원 줄이 바뀌면 미리보기로 다시 판정(금액·안내)
  useEffect(() => { if (!member) refresh(); }, [guest]);   // eslint-disable-line react-hooks/exhaustive-deps

  /** 탭 배지 — 화면에 그릴 줄 수(비회원은 기기 줄 수) */
  const count = member ? view.lines.length : guest.length;

  // 비회원인데 미리보기가 아직 없거나 못 받았으면 — 기기에 적어 둔 이름·규격으로 줄만 보인다(금액은 「확인 중」)
  const lines = member || view.lines.length || !guest.length ? view.lines
    : guest.map(g => ({ ...g, id: null, ...(g.snapshot || {}), status: 'checking', ok: false, message: null, unit_price: null, line: null, net: null, discount_amount: 0 }));

  /** 주문서에 넘길 줄 — 살 수 있는 줄만, 옛 주문서가 읽는 모양으로(가격은 서버 값). */
  const orderItems = view.lines.filter(l => l.ok).map(l => ({
    id: l.product_id, cart_line_id: l.id, name: l.name, spec: l.spec, image: l.image,
    quantity: l.unit_type === 'weight' ? 1 : l.quantity, grams: l.grams,
    pricing_type: l.unit_type === 'weight' ? 'weight' : 'unit',
    purchase_type: l.unit_type === 'box' ? 'box' : undefined,
    price: l.unit_price, unit_price: l.unit_type === 'weight' ? l.unit_price : undefined,
    pickup_only: !!l.pickup_only,
  }));

  return { member, view, lines, loading, error, storeNotice, dismissStoreNotice: () => setStoreNotice(null), count, guestLines: guest,
    refresh, add, setQty, remove, removeMany, clear, orderItems };
}
