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

export default API;