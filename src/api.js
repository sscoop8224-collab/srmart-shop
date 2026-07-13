import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// 서비스 도메인. 네이티브 앱은 절대 도메인, 웹은 같은 출처(상대경로 /api → nginx 프록시).
// Tailscale IP 하드코딩 제거 — 서버 이전으로 IP가 바뀌어도 도메인은 불변.
export const SITE = 'https://dongsinmarket.co.kr';

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
export const getStores = () => API.get('/stores');
export const getCategories = () => API.get('/categories');
export const getBanners = (storeId) => API.get('/banners', storeId ? { params: { store_id: storeId } } : {});
export const getProducts = (storeId) => API.get('/products', storeId ? { params: { store_id: storeId } } : {});
export const getActiveProducts = (storeId) => API.get('/products/active', storeId ? { params: { store_id: storeId } } : {});
export const getOrders = () => API.get('/orders');
export const getMyOrders = () => API.get('/orders/my');
export const createOrder = (data) => API.post('/orders', data);
export const getCoupons = () => API.get('/coupons');
export const matchZipcode = (zipcode) => API.post('/store/match-zipcode', { zipcode });
export const getMyPoints = () => API.get('/me/points');
export const deleteAccount = (password) => API.delete('/users/me', { data: { password } });
export const getMyPointHistory = () => API.get('/me/point-history');
export const requestReturn = (orderId, data) => API.post(`/orders/${orderId}/returns`, data);
export const getActiveEvents = () => API.get('/events/active');
export const getMyActiveCoupons = () => API.get('/users/me/coupons');
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

export default API;