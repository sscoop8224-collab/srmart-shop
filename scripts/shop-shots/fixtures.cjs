/**
 * 사진 촬영용 가짜 API 응답.
 *
 * 🔴 운영 백엔드를 한 번도 부르지 않는다. 로그인·검색·주문까지 전부 여기서 답한다 —
 *    그래서 계정을 만들거나 DB 에 기록이 남는 일이 없다(로그인 기록 · search_logs · 주문).
 * 값은 화면이 읽는 필드 이름에 맞췄다(src/ 의 각 화면에서 grep). 실제 손님·매장 데이터가 아니다.
 */
const P = (f) => `products/${f}`;

const stores = [
  // 전화·영업시간·표시 이름은 손님용 매장 API(audience=customer)의 칸 — 묶음 6 매장안내(S44)·고객센터(S46) · 값은 목업 STORES 그대로
  { id: 11, name: '에스알마트 왕길점', display_name: '에스알마트 왕길점', address: '인천 서구 왕길동', phone: '032-566-9949', operating_hours: '09:00~22:00' },
  { id: 1, name: '에스알마트 검암점', display_name: '에스알마트 검암점', address: '인천 서구 검암동', phone: '032-562-5241', operating_hours: '08:00~22:00' },
  { id: 12, name: '에스알마트 신흥점', display_name: '에스알마트 신흥점', address: '인천 중구 신흥동', phone: '032-765-5566', operating_hours: '08:00~22:00' },
];

const catRows = [
  ['01', '과자/간식', '스낵', '봉지과자'], ['02', '음료', '탄산음료', '콜라'], ['03', '식품', '라면', '봉지라면'],
  ['04', '생활용품', '세제', '주방세제'], ['05', '농산물', '과일', '사과'],
].map(([code, large, medium, small]) => ({ code, large, medium, small }));

const products = [
  { id: 101, name: '농심 메론킥', spec: '60g', large: '과자/간식', medium: '스낵', small: '봉지과자', price: 1450, stock: 40, is_available: 1, image: P('1786068757_wspx.png'), nutrition_images: JSON.stringify([P('1784171461_prq3.png')]), product_type: '가공식품', manufacturer: '농심', barcode: '8801043012345', box_quantity: 16, box_price_override: 21000, description: '달콤한 메론 맛이 나는 바삭한 스낵이에요.' },
  { id: 102, name: '코카콜라', spec: '1.5L', large: '음료', medium: '탄산음료', small: '콜라', price: 3200, stock: 24, is_available: 1, image: P('1789787258_cz4o.png'), nutrition_images: JSON.stringify([P('1789787267_ghns.png')]), product_type: '가공식품', manufacturer: '코카콜라음료', barcode: '8801094012345' },
  { id: 103, name: '신라면', spec: '120g×5입', large: '식품', medium: '라면', small: '봉지라면', price: 4380, stock: 15, is_available: 1, product_type: '가공식품', manufacturer: '농심' },
  { id: 104, name: '부사 사과', spec: '1.5kg(5~6과)', large: '농산물', medium: '과일', small: '사과', price: 12900, stock: 8, is_available: 1, product_type: '농산물', origin_country: '국산(경북 청송)' },
  { id: 105, name: '퐁퐁 주방세제', spec: '1.2L', large: '생활용품', medium: '세제', small: '주방세제', price: 5900, stock: 0, is_available: 1, product_type: '공산품', manufacturer: 'LG생활건강' },
  { id: 106, name: '한우 국거리', spec: '100g', large: '농산물', medium: '과일', small: '사과', price: 6900, unit_price: 6900, pricing_type: 'weight', stock: 30, is_available: 1, product_type: '축산물', origin_country: '국산(한우)' },
  { id: 107, name: '참이슬 후레쉬', spec: '360ml', large: '음료', medium: '탄산음료', small: '콜라', price: 1950, stock: 50, is_available: 1, is_adult: 1, product_type: '가공식품', manufacturer: '하이트진로' },
  { id: 108, name: '허니버터칩', spec: '120g', large: '과자/간식', medium: '스낵', small: '봉지과자', price: 3300, stock: 12, is_available: 1, product_type: '가공식품', manufacturer: '해태제과' },
];

const banners = [
  { id: 1, label: '이번 주 행사', title: '과자 2+1 행사', sub: '11월 한 달 동안 매장·온라인 모두', bg: 'linear-gradient(135deg,#00c471,#00a85e)', emoji: '🍪', filter: '과자/간식' },
  { id: 2, label: '신선 코너', title: '청송 사과 특가', sub: '산지 직송으로 더 싱싱하게', bg: 'linear-gradient(135deg,#ff8a3d,#ff5e57)', emoji: '🍎', filter: '농산물' },
];

// 홍보 이벤트 — 서버 `events` 표 모양(title · description · start/end · image_url) · 문구는 목업 EVENTS 그대로(묶음 6 S45)
const events = [
  { id: 1, title: '과자 2+1 행사', description: '좋아하는 과자를 셋 사면 하나는 덤으로 드려요.', start_date: '2026-10-31T15:00:00.000Z', end_date: '2026-11-30T14:59:59.000Z', is_active: 1, image_url: null },
  { id: 2, title: '음료 20% 할인', description: '시원한 음료를 20% 싸게 — 왕길점만.', start_date: '2026-11-09T15:00:00.000Z', end_date: '2026-11-20T14:59:59.000Z', is_active: 1, image_url: null },
];
// 공개 행사 — 서버 publicPromotions 모양 · event_ids 로 이벤트와 잇는다(2 의 행사는 연결된 상품이 없다 — opts.noLinked 로 비움)
const promotions = [
  { id: 41, name: '과자 2+1', label: '2+1', kind: 'bundle', event_ids: [1], products: [
    { product_id: 101, name: '농심 메론킥', spec: '60g', price: 1450, promo_price: null },
    { product_id: 108, name: '허니버터칩', spec: '120g', price: 3300, promo_price: null },
  ] },
  { id: 42, name: '음료 20%', label: '20%', kind: 'percent', event_ids: [2], products: [
    { product_id: 102, name: '코카콜라', spec: '1.5L', price: 3200, promo_price: 2560 },
  ] },
];

const customer = {
  id: 9001, name: '김손님', username: 'guest_demo', email: 'demo@example.com', role: 'customer', store_id: 11,
  phone: '010-1234-5678', address: '인천 서구 왕길로 123', address_detail: '101동 1001호', addressDetail: '101동 1001호',
  zipcode: '22689', dong_name: '왕길동', membership_tier: '단골', is_adult: 1, isAdult: true, needsThirdPartyConsent: false,
};

const myOrders = [
  { id: 'order_1762480000000', created_at: '2026-11-07T10:12:00+09:00', total_price: 21350, status: '배송완료', courier: 'CJ대한통운', tracking_number: '640123456789', return_status: null },
  { id: 'order_1762300000000', created_at: '2026-11-05T15:40:00+09:00', total_price: 8900, status: '배송중', courier: '한진택배', tracking_number: '512345678901' },
  { id: 'order_1762100000000', created_at: '2026-11-03T09:05:00+09:00', total_price: 15600, status: '배송완료', return_status: '반려', return_type: '환불', return_message: '환불 요청이 반려됐어요.', return_note: '개봉 후 7일이 지나 환불이 어려워요.' },
];

// 매장 픽업 주문(주류) — opts.pickupOrders 일 때 주문내역 맨 위에. 하나는 찾아갈 기한, 하나는 찾아감(2026-11-17 낮 지시 5)
const PICKUP_DEADLINE = '2026-11-20T14:59:59.000Z';   // = 2026-11-20 23:59:59 KST(서버 orders.pickup_deadline 을 JSON 으로 낸 모양)
const pickupOrders = [
  { id: 'order_1763340000000-P', created_at: '2026-11-17T09:20:00+09:00', total_price: 3900, final_amount: 3900, status: '결제완료', fulfillment_type: 'pickup', pickup_deadline: PICKUP_DEADLINE, picked_up_at: null },
  { id: 'order_1763100000000-P', created_at: '2026-11-14T19:05:00+09:00', total_price: 7800, final_amount: 7800, status: '결제완료', fulfillment_type: 'pickup', pickup_deadline: '2026-11-17T14:59:59.000Z', picked_up_at: '2026-11-15T18:40:00+09:00' },
];
const pickupPurchases = [
  { kind: 'online', id: 'order_1763340000000-P', date: '2026-11-17T09:20:00+09:00', store_name: '온라인', total: 3900, item_summary: '참이슬 후레쉬 360ml 2개', status: '결제완료' },
  { kind: 'online', id: 'order_1763100000000-P', date: '2026-11-14T19:05:00+09:00', store_name: '온라인', total: 7800, item_summary: '참이슬 후레쉬 360ml 4개', status: '결제완료' },
];

const purchases = {
  store_visible: true,
  purchases: [
    { kind: 'store', id: 5501, date: '2026-11-10T18:22:00+09:00', store_name: '왕길점', total: 23450, item_summary: '코카콜라 1.5L 외 4건', status: '결제완료' },
    { kind: 'online', id: 'order_1762480000000', date: '2026-11-07T10:12:00+09:00', store_name: '온라인', total: 21350, item_summary: '농심 메론킥 60g 외 2건', status: '배송완료' },
    { kind: 'store', id: 5490, date: '2026-11-02T12:01:00+09:00', store_name: '검암점', total: 6400, item_summary: '신라면 120g×5입', status: '취소', voided: true },
  ],
};
const storePurchase = {
  id: 5501, code: 'S11-20261110-0042', date: '2026-11-10T18:22:00+09:00', store: { name: '에스알마트 왕길점', address: '인천 서구 왕길동', tel: '032-000-0000' },
  // 세금은 서버처럼 과세 품목에서만(10,750 / 11 = 977) — 영수증 세금 줄(과세 물품가액·부가세·면세 물품가액) 촬영 · 2026-11-17 낮 지시 5
  pos_number: 1, subtotal: 23450, tax: 977, total: 23450, earned_points: 234, points_used: 0, points_balance: 3820,
  items: [
    { name: '코카콜라', spec: '1.5L', qty: 2, unit_price: 3200, line_total: 6400, tax_type: '과세' },
    { name: '농심 메론킥', spec: '60g', qty: 3, unit_price: 1450, line_total: 4350, tax_type: '과세' },
    { name: '부사 사과', spec: '1.5kg', qty: 1, unit_price: 12700, line_total: 12700, tax_type: '면세' },
  ],
  payments: [{ seq: 1, method: 'card', amount: 23450, status: 'approved' }],
};
const onlinePurchase = {
  id: 'order_1762480000000', date: '2026-11-07T10:12:00+09:00', total_price: 19350, total: 21350, delivery_fee: 3000, coupon_discount: 1000, points_used: 0,   // 서버처럼 total(낸 돈)을 따로 싣는다(목업 S18)
  status: '배송완료', courier: 'CJ대한통운', tracking_number: '640123456789', payment_method: '카카오페이',
  items: [
    { name: '농심 메론킥', spec: '60g', qty: 5, unit_price: 1450, line_total: 7250 },
    { name: '부사 사과', spec: '1.5kg', qty: 1, unit_price: 12100, line_total: 12100 },
  ],
};

const userCoupons = [
  { id: 1, coupon_name: '신규회원 10% 할인', discount_type: 'percent', discount: 10, min_purchase_amount: 20000, valid_until: '2026-12-31T00:00:00', code: 'WELCOME10', used_at: null },
  { id: 2, coupon_name: '배송비 3,000원 할인', discount_type: 'fixed', discount: 3000, min_purchase_amount: 0, valid_until: '2026-11-30T00:00:00', code: 'SHIP3000', used_at: null },
  { id: 3, coupon_name: '가을맞이 2,000원', discount_type: 'fixed', discount: 2000, min_purchase_amount: 15000, valid_until: '2026-10-31T00:00:00', code: 'FALL2000', used_at: '2026-10-20T00:00:00' },
];

const reviews = {
  reviews: [
    { id: 1, user_name: '김*희', rating: 5, content: '아이들이 정말 좋아해요. 또 살게요!', created_at: '2026-11-02T10:00:00+09:00', reply: '감사합니다 :)' },
    { id: 2, user_name: '박*수', rating: 4, content: '맛있는데 양이 조금 적어요.', created_at: '2026-10-28T10:00:00+09:00' },
  ],
  stats: { avg_rating: 4.5, total: 2 },   // 서버 /products/:id/reviews 와 같은 이름(예전 avg·count 는 틀린 이름이었다)
};

const loginHistory = [
  // 서버(GET /users/me/login-history)는 ip · success · created_at 만 준다 — IP 는 통째로 온다(가리는 것은 화면 몫 · 묶음 5)
  { created_at: '2026-11-11T09:12:00+09:00', ip: '211.234.51.7', success: 1 },
  { created_at: '2026-11-10T21:03:00+09:00', ip: '211.234.51.7', success: 1 },
  { created_at: '2026-11-09T08:44:00+09:00', ip: '::ffff:118.235.10.99', success: 0 },
];

// 묶음 2 — 홈 배송 한 줄(GET /stores/:id/delivery-promise). 서버 computePromise 의 모양 그대로(목업 DELIV 와 같은 날)
const DELIV = {
  today: { mode: 'today', date: '2026-11-12', cutoff: '15:00', start: '16:00', label: '오후 3시까지 주문하면 오늘 도착', sub: '오늘 오후 4시 출발' },
  tomorrow: { mode: 'tomorrow', date: '2026-11-13', cutoff: '15:00', start: '16:00', label: '내일 배송', sub: '오늘 주문 마감(오후 3시)이 지났어요' },
  closed: { mode: 'closed', date: '2026-11-13', cutoff: '15:00', start: '16:00', label: '내일 배송', sub: '오늘은 당일배송이 불가해요' },
  holiday: { mode: 'holiday', date: '2026-11-14', cutoff: '15:00', start: '16:00', label: '14일 배송', sub: '11월 13일은 배송 휴무예요' },
  off: { mode: 'off', date: null, cutoff: null, start: null, label: null, sub: null, text: null },
};
// 사업자 정보 — 목업처럼 상호만 채우고 나머지는 「—」(값은 대표님이 어드민에서 채운다)
const bizInfo = { company_name: '동신마켓', ceo_name: '—', address: '—', phone: '—', business_number: '—', mail_order_number: '—', privacy_officer: '—' };

// 서버 장바구니(2026-11-13 · 서버 src/services/shopCart.js 의 응답 모양) — 촬영 한 번(브라우저 문맥 하나)마다 opts._cart 에 줄을 둔다.
// 판정은 촬영에 필요한 만큼만 흉내 낸다: 재고 0 → 품절 · cartPreset 'check' 이면 목업 S08A 「줄 안내」 다섯 줄(할인·가격 바뀜·품절·이 매장에 없음·주류).
const CART_STORE = (id) => { const s = stores.find(x => x.id === id) || stores[0]; return { id: s.id, name: s.name }; };
const CART_PRESET = {
  check: [
    { product_id: 101, unit_type: 'box', quantity: 1, added_unit_price: 21000 },
    { product_id: 102, unit_type: 'unit', quantity: 2, added_unit_price: 2900 },
    { product_id: 105, unit_type: 'unit', quantity: 1 },
    { product_id: 103, unit_type: 'unit', quantity: 1, _status: 'not_in_store', _message: '왕길점에는 없는 상품이에요' },
    { product_id: 107, unit_type: 'unit', quantity: 1, _status: 'adult_required', _message: '주류는 19세 이상 본인확인 뒤에 살 수 있어요' },
  ],
  // 배송 + 매장 픽업(주류 · S52 · 2026-11-17 밤샘 지시 6) — 본인확인한 손님의 장바구니: 과자·음료(배송) + 참이슬 2병(픽업)
  pickup: [
    { product_id: 101, unit_type: 'box', quantity: 1, added_unit_price: 21000 },
    { product_id: 102, unit_type: 'unit', quantity: 2, added_unit_price: 2900 },
    { product_id: 107, unit_type: 'unit', quantity: 2, _pickup: true },
  ],
  // 픽업만(S51) — 참이슬 2병
  pickupOnly: [
    { product_id: 107, unit_type: 'unit', quantity: 2, _pickup: true },
  ],
  // 행사 할인 줄(2026-11-13 지시 3) — 메론킥 1박스(2+1 −7,000원) + 코카콜라 2개. 장바구니 바 · 주문서 · 주문 완료에 「행사 할인 −7,000원」
  promo: [
    { product_id: 101, unit_type: 'box', quantity: 1, added_unit_price: 21000 },
    { product_id: 102, unit_type: 'unit', quantity: 2, added_unit_price: 3200 },
  ],
};
function cartUnitPrice(p, unitType) {
  if (unitType === 'box') return p.box_price_override || p.price * (p.box_quantity || 1);
  return p.unit_price ?? p.price;
}
function cartView(rawLines, storeId) {
  const lines = rawLines.map((l, i) => {
    const p = products.find(x => x.id === l.product_id) || {};
    const o = { id: l.id ?? i + 1, product_id: l.product_id, unit_type: l.unit_type, quantity: l.quantity, grams: l.grams ?? null,
      added_unit_price: l.added_unit_price ?? null, name: p.name, spec: p.spec, image: p.image, box_quantity: p.box_quantity ?? null,
      status: 'ok', ok: true, message: null, unit_price: null, price_changed: false, line: 0, discount_amount: 0, net: 0, promo_label: null, on_sale: false, pickup_only: false };
    if (l._status) return Object.assign(o, { status: l._status, ok: false, message: l._message });
    if (l._pickup) o.pickup_only = true;   // 서버 판정 흉내 — 본인확인한 19세 이상 손님의 주류(매장 픽업)
    const unit = cartUnitPrice(p, l.unit_type);
    const line = l.unit_type === 'weight' ? Math.round(unit * (l.grams || 100) / 100) : unit * l.quantity;
    Object.assign(o, { unit_price: unit, line, net: line, price_changed: o.added_unit_price != null && o.added_unit_price !== unit });
    if (!p.stock) return Object.assign(o, { status: 'sold_out', ok: false, message: '품절이에요' });   // 서버처럼 품절 줄도 금액은 보인다(합계에서만 빠진다)
    if (p.id === 101 && l.unit_type === 'box') Object.assign(o, { discount_amount: 7000, net: line - 7000, promo_label: '2+1', on_sale: true });   // 목업 「2+1 (−7,000원)」
    return o;
  });
  const okl = lines.filter(l => l.ok);
  const gross = okl.reduce((s, l) => s + l.line, 0), promo = okl.reduce((s, l) => s + l.discount_amount, 0);
  return { brand: 'srm', store: CART_STORE(storeId), store_brand_mismatch: false, updated_at: '2026-11-13T10:00:00.000Z', lines, gross, promo_discount: promo, subtotal: gross - promo, ok_count: okl.length, problem_count: lines.length - okl.length };
}
function cartRoute(pathname, method, opts, body) {
  const st = opts._cart || (opts._cart = {});
  if (!st.lines) { st.lines = (CART_PRESET[opts.cartPreset] || []).map((l, i) => ({ id: i + 1, ...l })); st.seq = st.lines.length; st.gets = 0; }
  // cartStoreFlip — 처음 한 번은 검암점, 그다음부터 왕길점(목업 「매장 바뀜」: 왕길점 기준으로 다시 확인했어요)
  const storeId = () => (opts.cartStoreFlip && st.gets++ === 0 ? 1 : 11);
  const key = (l) => `${l.product_id}:${l.unit_type}`;
  const put = (l, mode) => {
    const cur = st.lines.find(x => key(x) === key(l));
    const p = products.find(x => x.id === Number(l.product_id)) || {};
    if (!cur) { st.lines.push({ id: ++st.seq, product_id: Number(l.product_id), unit_type: l.unit_type || 'unit', quantity: l.quantity || 1, grams: l.grams ?? null, added_unit_price: cartUnitPrice(p, l.unit_type) }); return; }
    if (cur.unit_type === 'weight') cur.grams = Math.min(20000, mode === 'add' ? (cur.grams || 0) + (l.grams || 0) : l.grams);
    else cur.quantity = Math.min(99, mode === 'add' ? cur.quantity + (l.quantity || 1) : l.quantity);
  };
  const j = (b) => ({ status: 200, body: b });
  if (pathname === '/shop/cart/preview') return j(cartView((body && body.items) || [], Number(body && body.store_id) || 11));
  if (pathname === '/shop/cart/merge') {
    const items = (body && body.items) || [];
    const had = new Set(st.lines.map(key));
    items.forEach(l => put(l, 'add'));
    return j({ ...cartView(st.lines, storeId()), merged: { added: items.filter(l => !had.has(key(l))).length, summed: items.filter(l => had.has(key(l))).length, clamped: 0, dropped: 0, invalid: 0 } });
  }
  if (pathname === '/shop/cart/lines' && method === 'PUT') put(body || {}, body && body.mode);
  const del = pathname.match(/^\/shop\/cart\/lines\/(\d+)$/);
  if (del && method === 'DELETE') st.lines = st.lines.filter(l => l.id !== Number(del[1]));
  if (pathname === '/shop/cart' && method === 'DELETE') st.lines = [];
  return j(cartView(st.lines, storeId()));
}

// 주문서 견적(POST /api/shop/quote · 서버 index.js 와 같은 응답 모양) — 줄 금액·행사는 cartView 와 같은 흉내(메론킥 박스 2+1 −7,000원),
// 쿠폰은 보유 쿠폰(percent·fixed · 최소 금액) · 코드 쿠폰, 배송비는 3,000원 · 3만 원 이상 무료(가짜 배송 권역과 같다).
function quoteRoute(body) {
  const items = (body && body.items) || [];
  const lines = items.map((it) => {
    const p = products.find(x => x.id === Number(it.id)) || {};
    const unitType = it.quantity_type === 'box' ? 'box' : (p.pricing_type === 'weight' ? 'weight' : 'unit');
    const unit = cartUnitPrice(p, unitType);
    const line = unitType === 'weight' ? Math.round(unit * (it.grams || 100) / 100) : unit * (Number(it.quantity) || 1);
    const disc = p.id === 101 && unitType === 'box' ? 7000 * (Number(it.quantity) || 1) : 0;
    return { id: Number(it.id), ok: !!p.stock, error: p.stock ? null : '재고가 부족해요 (남은 수량: 0개)', line, discount_amount: disc, net: line - disc, promotion_id: disc ? 1 : null, promo_label: disc ? '2+1' : null };
  });
  const gross = lines.reduce((a, l) => a + l.line, 0), promo = lines.reduce((a, l) => a + l.discount_amount, 0), subtotal = gross - promo;
  let coupon = 0, couponError = null;
  const c = body && body.coupon_id ? userCoupons.find(x => String(x.id) === String(body.coupon_id))
    : body && body.coupon_code ? userCoupons.find(x => x.code === String(body.coupon_code).toUpperCase()) : null;
  if ((body && (body.coupon_id || body.coupon_code)) && !c) couponError = '쓸 수 없는 쿠폰이에요';
  else if (c && subtotal < (c.min_purchase_amount || 0)) couponError = `${(c.min_purchase_amount).toLocaleString('ko-KR')}원 이상 주문해야 쓸 수 있어요`;
  else if (c) coupon = c.discount_type === 'percent' ? Math.floor(subtotal * c.discount / 100) : Math.min(subtotal, c.discount);
  const fee = body && body.fulfillment === 'pickup' ? 0 : subtotal >= 30000 ? 0 : 3000;   // 매장 픽업은 배송비 없음
  return { status: 200, body: { store_id: 11, lines, gross, promo_discount: promo, subtotal, coupon_discount: coupon, coupon_error: couponError,
    delivery_fee: fee, delivery_fee_rule: 3000, free_delivery_min: 30000, out_of_zone: false, final_before_points: Math.max(0, subtotal - coupon + fee) } };
}

/** /api 하위 경로 → 응답. body = 요청 본문(JSON · 장바구니가 읽는다). */
function route(pathname, method, search, opts = {}, body = null) {
  if (pathname === '/shop/cart' || pathname.startsWith('/shop/cart/')) return cartRoute(pathname, method, opts, body);
  if (pathname === '/shop/quote') return quoteRoute(body);
  const user = opts.user || customer;
  const j = (b, s = 200) => ({ status: s, body: b });
  if (pathname === '/stores') return opts.storesFail ? j({ error: '서버 오류' }, 500) : j(stores);
  // 자주 묻는 질문(묶음 6 S46) — 목업 예시 문구 그대로
  if (pathname === '/shop/faqs') return j([
    { id: 1, category: '배송', question: '당일 배송은 몇 시까지 주문해야 하나요?', answer: '매장마다 달라요. 홈·장바구니의 배송 안내 한 줄에 그 매장의 마감 시각이 나와요.' },
    { id: 2, category: '배송', question: '배송 휴무일·당일배송이 안 되는 날은요?', answer: '홈·장바구니의 배송 안내 줄에 그날 배송이 어떻게 되는지 나와요.' },
    { id: 3, category: '주문', question: '주문을 취소하고 싶어요', answer: '배송 준비 전이면 주문내역에서 바로 취소할 수 있어요.' },
    { id: 4, category: '주문', question: '환불·교환은 어떻게 하나요?', answer: '주문내역 → 주문 카드의 「환불 요청 / 교환 요청」.' },
    { id: 5, category: '혜택', question: '포인트·쿠폰은 어디서 보나요?', answer: '마이 → 요약 칸의 포인트·쿠폰.' },
  ]);
  if (/^\/stores\/\d+\/delivery-promise$/.test(pathname)) return j(DELIV[opts.deliv || 'today']);
  // 알림 설정(S50) — 서버 GET·PUT /api/users/me/notification-prefs 모양. PUT 은 받은 값에 그날 날짜를 붙여 돌려준다
  if (pathname === '/users/me/notification-prefs') {
    const st = opts._prefs || (opts._prefs = { order_notify: true, order_notify_at: null, marketing_push: true, marketing_push_at: '2026-11-12 10:00:00' });
    if (method === 'PUT' && body) for (const k of ['order_notify', 'marketing_push']) if (k in body) { st[k] = !!body[k]; st[k + '_at'] = '2026-11-17 09:00:00'; }
    return j({ ...st });
  }
  if (pathname === '/signup-coupon') return j(opts.noCoupon ? { enabled: false } : { enabled: true, label: '신규회원 10% 할인 쿠폰', sub: '2만 원 이상 주문 · 가입 후 30일' });
  if (pathname === '/shop/business-info') return j(bizInfo);
  // 공지(묶음 5 S26) — 서버 shopContent.js 와 같은 모양(created_at 은 'YYYY-MM-DD HH:mm' 글자) · noNotices 면 비어 있음
  // newNotice — 오늘 올라온 공지 하나를 맨 위에(홈 종 빨간 점 촬영 · 2026-11-17 낮 지시 5). 시각은 찍는 순간의 그 지역 시각.
  if (pathname === '/shop/notices' && opts.newNotice && !opts.noNotices) {
    const d = new Date(Date.now() - 60000), p2 = (n) => String(n).padStart(2, '0');
    const now = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
    return j([
      { id: 3, store_id: null, title: '연말 휴무 안내', body: '12월 31일은 오후 6시까지 영업해요.', is_pinned: 0, is_visible: 1, created_at: now, updated_at: now },
      ...route('/shop/notices', 'GET', '', { ...opts, newNotice: 0 }).body,
    ]);
  }
  if (pathname === '/shop/notices') return j(opts.noNotices ? [] : [
    { id: 2, store_id: null, title: '추석 연휴 배송 안내', body: '11월 15일은 배송이 하루 늦어질 수 있어요.', is_pinned: 1, is_visible: 1, created_at: '2026-11-01 09:00', updated_at: '2026-11-01 09:00' },
    { id: 1, store_id: 11, title: '왕길점 영업시간 변경', body: '11월부터 밤 10시까지 영업해요.', is_pinned: 0, is_visible: 1, created_at: '2026-10-20 10:00', updated_at: '2026-10-20 10:00' },
  ]);
  if (pathname === '/categories') return j(catRows);
  if (pathname === '/banners') return j(opts.noBanners ? [] : opts.bannerTokenBg ? banners.map(({ bg, ...b }) => b) : banners);   // bannerTokenBg — 관리자가 고른 색(bg) 없이: 목업처럼 토큰 초록으로(모양만 비교)
  if (pathname === '/splash-ads') return j([]);
  if (pathname === '/products/active' || pathname === '/products') {
    if (opts.productsFail) return j({ error: 'fail' }, 500);
    if (opts.productsSlow) return { status: 200, body: products, delay: 60000 };
    if (opts.lowStock) return j(products.map(p => (p.id === 101 ? { ...p, stock: 7, stock_state: 'low', stock_left: 7 } : p)));   // 상세 「7개 남음」(목업 S04 재고 적음)
    if (opts.manyProducts) return j([0, 1, 2, 3].flatMap(k => products.map(p => (k ? { ...p, id: p.id + k * 100 } : p))));   // 32개 — 회전 검사가 스크롤을 잴 수 있게
    return j(opts.noProducts ? [] : products);
  }
  if (pathname === '/events/active') return j(opts.noEvents ? [] : events);
  if (pathname === '/promotions/active') {
    const ev = Number(new URLSearchParams(search).get('event_id')) || null;
    return j(promotions.filter((p) => !ev || (!opts.noLinked && p.event_ids.includes(ev))));
  }
  if (pathname === '/login') {
    if (opts.loginFail) return j({ error: '아이디 또는 비밀번호가 틀려요!' }, 401);
    // mustChange — 임시 비밀번호로 로그인(목업 S31) · needsConsent — 매장 이용 동의를 아직 안 물은 회원(목업 S32)
    return j({ token: 'mock.token.value', user: { ...user, ...(opts.mustChange ? { must_change_password: 1 } : {}), ...(opts.needsConsent ? { needsThirdPartyConsent: true } : {}) } });
  }
  // 가입(묶음 5 P04) — 서버 index.js 와 같은 모양. 쿠폰은 서버가 「지급했다」 할 때만 granted(noCoupon 이면 꺼짐)
  if (pathname === '/register') return j({ message: '회원가입 성공! 🎉', signup_coupon: opts.noCoupon ? { granted: false } : { granted: true, user_coupon_id: 9, coupon_id: 3, name: '신규회원 10% 할인', label: '신규회원 10% 할인 쿠폰', sub: '2만 원 이상 주문 · 가입 후 30일' } });
  if (pathname === '/orders/my') return j(opts.noOrders ? [] : opts.pickupOrders ? [...pickupOrders, ...myOrders] : myOrders);   // noOrders — 주문내역 비어 있음(목업 P01)
  // 서버 찜 줄은 `w.*` + 상품 몇 칸 — id 는 **찜 줄 번호**, 상품 번호는 product_id, 가격은 없다(묶음 5 — 진짜 모양으로)
  if (pathname === '/users/me/wishlist') return j(opts.emptyWish ? [] : [products[0], products[3]].map((p, i) => ({ id: 501 + i, user_id: 9001, product_id: p.id, created_at: '2026-11-10T10:00:00', name: p.name, large: p.large, spec: p.spec, image: p.image })));
  if (pathname === '/wishlist') return j({ wishlisted: true, message: '찜 목록에 담았어요!' });
  // 최근 본 상품(묶음 6 S41) — 서버처럼 가격 없이 상품 칸만 · 999 는 지금 매장에서 안 파는 상품(앱이 빼고 개수를 말한다)
  if (pathname === '/users/me/recent-views') return j(opts.noRecent ? [] : [102, 104, 103, 101, 999].map((id, i) => {
    const p = products.find((x) => x.id === id) || { id, name: '단종 상품', large: '식품' };
    return { id: 700 + i, user_id: 9001, product_id: id, viewed_at: '2026-11-12T10:00:00', name: p.name, large: p.large, spec: p.spec, image: p.image };
  }));
  // 내 리뷰(묶음 6 S42) — 서버처럼 r.* + product_name
  if (pathname === '/users/me/reviews') return j(opts.noReviews ? [] : [
    { id: 31, product_id: 101, user_id: 9001, rating: 5, content: '아이들이 정말 좋아해요. 또 살게요!', reply: '감사합니다 :)', is_hidden: 0, created_at: '2026-11-02T01:00:00.000Z', product_name: '농심 메론킥' },
    { id: 30, product_id: 104, user_id: 9001, rating: 4, content: '달고 아삭해요.', reply: null, is_hidden: 0, created_at: '2026-10-28T01:00:00.000Z', product_name: '부사 사과' },
  ]);
  if (opts.benefitsFail && (pathname === '/me/points' || pathname === '/users/me/coupons')) return { abort: true };   // 보유 쿠폰·포인트를 못 불러옴(목업 S10)
  if (pathname === '/me/points') return j({ points: 3820, expiring_soon: 500 });
  if (pathname === '/users/me/coupons') return j(userCoupons);
  if (pathname === '/coupons/my') return j(userCoupons.filter(c => !c.used_at));
  if (pathname === '/users/me/login-history') return j(loginHistory);
  if (pathname === '/me/purchases' && opts.noOrders) return j({ store_visible: true, purchases: [] });
  if (pathname === '/me/purchases' && opts.pickupOrders) return j({ ...purchases, purchases: [...pickupPurchases, ...purchases.purchases] });
  if (pathname === '/me/purchases') return j(opts.noConsent ? { ...purchases, store_visible: false, purchases: purchases.purchases.filter(p => p.kind === 'online') } : purchases);
  // voidedReceipt — 취소된 매장 거래(목업 S17 「취소된 거래」)
  if (pathname.startsWith('/me/purchases/store/')) return j(opts.voidedReceipt ? { ...storePurchase, voided: true, voided_at: '2026-11-10T18:40:00+09:00', payments: storePurchase.payments.map(p => ({ ...p, status: 'canceled' })) } : storePurchase);
  if (pathname.startsWith('/me/purchases/online/')) return j(onlinePurchase);
  // reviewsFail — 응답 자체가 없다(인터넷 끊김) · noReviews — 리뷰 0개(첫 리뷰)
  if (/^\/products\/\d+\/reviews$/.test(pathname)) return opts.reviewsFail ? { abort: true } : j(opts.noReviews ? { reviews: [], stats: { avg_rating: 0, total: 0 } } : reviews);
  if (/^\/products\/\d+\/related$/.test(pathname)) return j(products.slice(2, 6));
  if (pathname === '/search/popular') return j([{ keyword: '콜라' }, { keyword: '라면' }, { keyword: '사과' }, { keyword: '과자' }]);
  if (pathname === '/search/suggest') return j(['코카콜라 1.5L', '코카콜라 제로', '콜라겐']);
  if (pathname === '/search') {
    if (opts.searchSlow) return { status: 200, body: {}, delay: 60000 };
    if (opts.searchLikeMock) return j({ products: [103, 108, 101].map(id => products.find(p => p.id === id)) });   // 목업 S06 「라면」 결과 3개와 같은 줄
    const q = new URLSearchParams(search).get('q') || '';
    return j({ products: q === '없는상품' ? [] : products.filter(p => p.name.includes(q) || q === '') });
  }
  if (pathname === '/store/match-zipcode' && opts.noZone) return j({ matched: false, message: '배송할 수 없는 지역이에요' });   // 목업 S11 배송 불가
  if (pathname === '/store/match-zipcode') return j({ matched: true, zone: { zone_name: '왕길동 배송구역', free_delivery_min: 30000 }, delivery_fee: 3000 });
  if (pathname === '/store/coverage') return j({ stores: [{ store_id: 11, store_name: '에스알마트 왕길점' }], recommended: { store_id: 11, store_name: '에스알마트 왕길점' } });
  if (pathname === '/orders') return j({ ok: true, fulfillment: (body && body.fulfillment) || 'delivery', pickup_deadline: body && body.fulfillment === 'pickup' ? PICKUP_DEADLINE : null });
  if (pathname === '/orders/checkout') return j({ payment_group_id: 'PGTEST', orders: ((body && body.orders) || []).map(o => ({ orderId: o.id, fulfillment: o.fulfillment, final_amount: 0, pickup_deadline: o.fulfillment === 'pickup' ? PICKUP_DEADLINE : null })) });
  if (pathname === '/chatbot' && opts.chatFail) return j({ error: '서버 오류' }, 500);
  if (pathname === '/chatbot') return j({ reply: '네! 코카콜라 1.5L 는 왕길점에 24개 있어요. 장바구니에 담아 드릴까요?' });
  if (pathname === '/users/third-party-consent') return j({ ok: true });
  return j({}, 200);
}

module.exports = { route, products, customer, stores };
