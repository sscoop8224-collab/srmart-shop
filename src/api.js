import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('srmart_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const register = (data) => API.post('/register', data);
export const login = (username, password) => API.post('/login', { username, password });
export const getStores = () => API.get('/stores');
export const getProducts = (storeId) => API.get('/products', storeId ? { params: { store_id: storeId } } : {});
export const getActiveProducts = (storeId) => API.get('/products/active', storeId ? { params: { store_id: storeId } } : {});
export const getOrders = () => API.get('/orders');
export const getMyOrders = () => API.get('/orders/my');
export const createOrder = (data) => API.post('/orders', data);
export const getCoupons = () => API.get('/coupons');
export const matchZipcode = (zipcode) => API.post('/store/match-zipcode', { zipcode });
export const getMyPoints = () => API.get('/me/points');
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

export default API;