import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// 서비스 도메인. 네이티브 앱은 절대 도메인, 웹은 같은 출처(상대경로 /api → nginx 프록시).
// Tailscale IP 하드코딩 제거 — 서버 이전으로 IP가 바뀌어도 도메인은 불변.
// 도메인 .co.kr → .com 통일(2026-07). capacitor.config.ts가 로드하는 origin(www.dongsinmarket.com)과 일치시킴.
// 재발 방지: 값은 REACT_APP_SITE로 오버라이드 가능(빌드타임). .env 계열은 gitignore이므로,
// 추적되는 기본값(아래 .com)이 배포의 단일 진실이다 — 도메인이 또 바뀌면 이 상수만 고치면 됨.
export const SITE = process.env.REACT_APP_SITE || 'https://www.dongsinmarket.com';

// [imgUrl] 상품/주문 이미지 렌더 공용 헬퍼. 저장값('products/xxx.png') → 웹=상대 /uploads/... (nginx 서빙), 네이티브=도메인 절대.
// 이미 http/data/blob URL이면 그대로 둔다.
export const imgUrl = (p) => {
  if (!p) return '';
  if (/^(https?:|data:|blob:)/.test(p)) return p;
  const rel = p.startsWith('/uploads/') ? p : `/uploads/${p.replace(/^\/+/, '')}`;
  return `${Capacitor.isNativePlatform() ? SITE : ''}${rel}`;
};

const API = axios.create({
  baseURL: Capacitor.isNativePlatform() ? `${SITE}/api` : '/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('srmart_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── 카카오페이 결제 서버 (메인 백엔드와 별개, 포트 5001) ──────────
// Tailscale IP 제거. 웹(개발)=로컬 :5001, 네이티브=도메인 경유.
// TODO(PG 실연동): Nginx가 `/pay/` → `127.0.0.1:5001/api/` 로 프록시하도록 배선 필요.
//   그 전까지 결제는 휴면(테스트 CID). 배선되면 웹도 `${SITE}/pay`로 통일.
const PAY_API = axios.create({
  baseURL: Capacitor.isNativePlatform() ? `${SITE}/pay` : 'http://localhost:5001/api',
});

export const kakaoPayReady = (orderInfo) =>
  PAY_API.post('/kakaopay/ready', {
    orderId: orderInfo.orderId,
    userId: orderInfo.userId,
    itemName: orderInfo.itemName,
    quantity: orderInfo.quantity,
    totalAmount: orderInfo.totalAmount,
  }).then((res) => res.data);

export const register = (data) => API.post('/register', data);
export const login = (username, password) => API.post('/login', { username, password });
// 손님 화면용 매장 목록 (2026-11-12) — `audience=customer` 면 서버가 「손님에게 보이기」가 켜진
// 매장만, 공개 항목(전화·영업시간·우편번호·표시 이름)과 함께 준다. 옛 서버는 이 값을 무시하고
// 전체를 주므로 배포 순서가 어긋나도 깨지지 않는다.
export const getStores = () => API.get('/stores', { params: { audience: 'customer' } });
// 가입 쿠폰 문구 — 서버가 「지급 가능」(정책 켬 + 문자 인증 연동 켬)일 때만 { enabled:true, label, sub } 를 준다.
// 🔴 화면은 이 값에만 따른다. 쿠폰 금액·문구를 화면에 직접 적지 않는다(지킬 수 없는 약속이 된다).
export const getSignupCoupon = () => API.get('/signup-coupon');
// 홈 배송 한 줄(묶음 2) — 매장 배송 설정에서 서버가 계산한 약속. mode: today | tomorrow | closed | holiday | off(안 보인다).
// 🔴 화면은 시각·문구를 직접 만들지 않는다 — 서버의 label·sub 만 쓴다(마감 시각이 바뀌면 화면이 거짓말을 한다).
export const getDeliveryPromise = (storeId) => API.get(`/stores/${storeId}/delivery-promise`);
// 홈 맨 아래 사업자 정보(묶음 2) — 어드민 「사업자 정보」(대표만)에서 채운다. 빈 칸은 화면이 안 그린다.
export const getBusinessInfo = () => API.get('/shop/business-info');
// 자주 묻는 질문(묶음 6 S46) — 어드민 「자주 묻는 질문」에서 쓴 것 · 보이기로 둔 것만
export const getShopFaqs = () => API.get('/shop/faqs');
// 공지사항(묶음 5 S26 · F2) — 손님: 전 매장 공지 + 이 매장 공지. 관리자 등록·숨기기는 어드민 「공지 관리」와 같은 경로
export const getShopNotices = (storeId) => API.get('/shop/notices', storeId ? { params: { store_id: storeId } } : {});
export const createShopNotice = (data) => API.post('/admin/shop-notices', data);
export const hideShopNotice = (id) => API.put(`/admin/shop-notices/${id}/visible`, { visible: false });
// 진행 중인 행사(프로모션) — 상품마다 `promo_price`(1개만 사도 깎이는 행사) 또는 문구(`label`).
export const getActivePromotions = (storeId) => API.get('/promotions/active', storeId ? { params: { store_id: storeId } } : {});
export const getCategories = () => API.get('/categories');
export const getBanners = (storeId) => API.get('/banners', storeId ? { params: { store_id: storeId } } : {});
// 스플래시 광고(콜드스타트 2번째 화면). 활성 광고 목록(공용+매장), 노출순서.
export const getSplashAds = (storeId) => API.get('/splash-ads', storeId ? { params: { store_id: storeId } } : {});
export const getProducts = (storeId) => API.get('/products', storeId ? { params: { store_id: storeId } } : {});
export const getActiveProducts = (storeId) => API.get('/products/active', storeId ? { params: { store_id: storeId } } : {});
export const getOrders = () => API.get('/orders');
export const getMyOrders = () => API.get('/orders/my');
export const createOrder = (data) => API.post('/orders', data);
export const getCoupons = () => API.get('/coupons');
// store_id는 owner 매장 미리보기 전용(useCheckoutFlow가 currentStoreId를 넘김) — 일반 회원은
// 백엔드가 body.store_id를 무시하고 항상 본인 가입점포로 처리하므로 그냥 같이 보내도 무해하다.
export const matchZipcode = (zipcode, dong, storeId) => API.post('/store/match-zipcode', { zipcode, dong, store_id: storeId });
// 주소 커버리지(공개) — 동 이름 우선 + 우편번호. 이 주소를 배송하는 매장 전체 + 추천 1곳 (회원가입 안내용)
export const getCoverage = (zipcode, dong) => API.post('/store/coverage', { zipcode, dong });
// FCM 기기 토큰 등록(푸시) — 앱 실행 시. 로그인 상태면 서버가 user·store 연결, 게스트는 store_id 전달.
export const registerPushToken = (token, platform, store_id) => API.post('/push/register', { token, platform, store_id });
export const getMyPoints = () => API.get('/me/points');
export const deleteAccount = (password) => API.delete('/users/me', { data: { password } });
export const getMyPointHistory = () => API.get('/me/point-history');
export const requestReturn = (orderId, data) => API.post(`/orders/${orderId}/returns`, data);
export const getActiveEvents = () => API.get('/events/active');
export const getMyActiveCoupons = () => API.get('/users/me/coupons');
// 알림 설정(2026-11-12 지시 5) — 주문·배송 알림 / 혜택 알림(광고성) 따로.
// 응답: { order_notify, order_notify_at, marketing_push, marketing_push_at } — _at 은 마지막으로 켜거나 끈 시각('YYYY-MM-DD HH:mm:ss' | null).
export const getNotificationPrefs = () => API.get('/users/me/notification-prefs');
// 바꿀 값만 보낸다 — { order_notify?, marketing_push? }. 같은 모양으로 돌아온다.
export const updateNotificationPrefs = (patch) => API.put('/users/me/notification-prefs', patch);
export const applyCoupon = (data) => API.post('/coupons/apply', data);
// 검색
export const searchProducts = (params) => API.get('/search', { params });
export const getSearchSuggestions = (q) => API.get('/search/suggest', { params: { q } });
export const getPopularSearches = () => API.get('/search/popular');
// 리뷰
export const getProductReviews = (id, params) => API.get(`/products/${id}/reviews`, { params });
export const createReview = (data) => API.post('/reviews', data);
export const deleteReview = (id) => API.delete(`/reviews/${id}`);
export const markReviewHelpful = (id) => API.post(`/reviews/${id}/helpful`);
export const getMyReviews = () => API.get('/users/me/reviews');
// 위시리스트
export const getWishlist = () => API.get('/users/me/wishlist');
export const toggleWishlist = (product_id) => API.post('/wishlist', { product_id });
export const checkWishlist = (product_ids) => API.get('/wishlist/check', { params: { product_ids: product_ids.join(',') } });
// 최근 본 상품
export const recordRecentView = (product_id) => API.post('/recent-views', { product_id });
export const getRecentViews = () => API.get('/users/me/recent-views');
// 추천
export const getRelatedProducts = (id) => API.get(`/products/${id}/related`);
export const getFrequentlyBought = (id) => API.get(`/products/${id}/frequently-bought-together`);
export const getRecommendations = () => API.get('/recommendations');

// 구매 내역(온라인 주문 + 매장 구매) — 전자영수증을 "받는 쪽".
// 전부 **본인 것만** 나온다. 서버가 req.user 로만 대상을 정하고, 회원 번호를 넘길 자리가
// 아예 없다(srmart-backend/src/routes/myPurchases.js).
export const getMyPurchases = (params) => API.get('/me/purchases', { params });
export const getStorePurchase = (saleId) => API.get(`/me/purchases/store/${saleId}`);
export const getOnlinePurchase = (orderId) => API.get(`/me/purchases/online/${orderId}`);

export default API;