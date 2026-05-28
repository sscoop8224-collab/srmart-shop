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
export const getProducts = () => API.get('/products');
export const getOrders = () => API.get('/orders');
export const createOrder = (data) => API.post('/orders', data);

export default API;