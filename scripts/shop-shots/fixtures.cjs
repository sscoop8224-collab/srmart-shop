/**
 * 사진 촬영용 가짜 API 응답.
 *
 * 🔴 운영 백엔드를 한 번도 부르지 않는다. 로그인·검색·주문까지 전부 여기서 답한다 —
 *    그래서 계정을 만들거나 DB 에 기록이 남는 일이 없다(로그인 기록 · search_logs · 주문).
 * 값은 화면이 읽는 필드 이름에 맞췄다(src/ 의 각 화면에서 grep). 실제 손님·매장 데이터가 아니다.
 */
const P = (f) => `products/${f}`;

const stores = [
  { id: 11, name: '에스알마트 왕길점', address: '인천 서구 왕길동' },
  { id: 1, name: '에스알마트 검암점', address: '인천 서구 검암동' },
  { id: 12, name: '에스알마트 신흥점', address: '인천 중구 신흥동' },
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

const events = [
  { name: '2+1', event_type: '퍼센트할인', discount_value: 30, products: JSON.stringify([{ id: 101 }, { id: 108 }]) },
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
  pos_number: 1, subtotal: 21318, tax: 2132, total: 23450, earned_points: 234, points_used: 0, points_balance: 3820,
  items: [
    { name: '코카콜라', spec: '1.5L', qty: 2, unit_price: 3200, line_total: 6400 },
    { name: '농심 메론킥', spec: '60g', qty: 3, unit_price: 1450, line_total: 4350 },
    { name: '부사 사과', spec: '1.5kg', qty: 1, unit_price: 12700, line_total: 12700, tax_type: '면세' },
  ],
  payments: [{ seq: 1, method: 'card', amount: 23450, status: 'approved' }],
};
const onlinePurchase = {
  id: 'order_1762480000000', date: '2026-11-07T10:12:00+09:00', total_price: 21350, delivery_fee: 3000, coupon_discount: 1000, points_used: 0,
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
  stats: { avg: 4.5, count: 2 },
};

const loginHistory = [
  { created_at: '2026-11-11T09:12:00+09:00', ip: '211.234.*.*', success: 1, user_agent: 'Android' },
  { created_at: '2026-11-10T21:03:00+09:00', ip: '211.234.*.*', success: 1, user_agent: 'Android' },
  { created_at: '2026-11-09T08:44:00+09:00', ip: '118.235.*.*', success: 0, user_agent: 'iPhone' },
];

/** /api 하위 경로 → 응답. 함수면 (url, method, body) 로 부른다. */
function route(pathname, method, search, opts = {}) {
  const user = opts.user || customer;
  const j = (b, s = 200) => ({ status: s, body: b });
  if (pathname === '/stores') return j(stores);
  if (pathname === '/categories') return j(catRows);
  if (pathname === '/banners') return j(opts.noBanners ? [] : banners);
  if (pathname === '/splash-ads') return j([]);
  if (pathname === '/products/active' || pathname === '/products') {
    if (opts.productsFail) return j({ error: 'fail' }, 500);
    if (opts.productsSlow) return { status: 200, body: products, delay: 60000 };
    return j(opts.noProducts ? [] : products);
  }
  if (pathname === '/events/active') return j(events);
  if (pathname === '/login') {
    if (opts.loginFail) return j({ error: '아이디 또는 비밀번호가 틀려요!' }, 401);
    return j({ token: 'mock.token.value', user });
  }
  if (pathname === '/orders/my') return j(myOrders);
  if (pathname === '/users/me/wishlist') return j(opts.emptyWish ? [] : [products[0], products[3]]);
  if (pathname === '/wishlist') return j({ wishlisted: true, message: '찜 목록에 담았어요!' });
  if (pathname === '/me/points') return j({ points: 3820, expiring_soon: 500 });
  if (pathname === '/users/me/coupons') return j(userCoupons);
  if (pathname === '/coupons/my') return j(userCoupons.filter(c => !c.used_at));
  if (pathname === '/users/me/login-history') return j(loginHistory);
  if (pathname === '/me/purchases') return j(opts.noConsent ? { ...purchases, store_visible: false, purchases: purchases.purchases.filter(p => p.kind === 'online') } : purchases);
  if (pathname.startsWith('/me/purchases/store/')) return j(storePurchase);
  if (pathname.startsWith('/me/purchases/online/')) return j(onlinePurchase);
  if (/^\/products\/\d+\/reviews$/.test(pathname)) return j(reviews);
  if (/^\/products\/\d+\/related$/.test(pathname)) return j(products.slice(2, 6));
  if (pathname === '/search/popular') return j([{ keyword: '콜라' }, { keyword: '라면' }, { keyword: '사과' }, { keyword: '과자' }]);
  if (pathname === '/search/suggest') return j(['코카콜라 1.5L', '코카콜라 제로', '콜라겐']);
  if (pathname === '/search') {
    const q = new URLSearchParams(search).get('q') || '';
    return j({ products: q === '없는상품' ? [] : products.filter(p => p.name.includes(q) || q === '') });
  }
  if (pathname === '/store/match-zipcode') return j({ matched: true, zone: { zone_name: '왕길동 배송구역', free_delivery_min: 30000 }, delivery_fee: 3000 });
  if (pathname === '/store/coverage') return j({ stores: [{ store_id: 11, store_name: '에스알마트 왕길점' }], recommended: { store_id: 11, store_name: '에스알마트 왕길점' } });
  if (pathname === '/orders') return j({ ok: true });
  if (pathname === '/chatbot') return j({ reply: '네! 코카콜라 1.5L 는 왕길점에 24개 있어요. 장바구니에 담아 드릴까요?' });
  if (pathname === '/users/third-party-consent') return j({ ok: true });
  return j({}, 200);
}

module.exports = { route, products, customer, stores };
