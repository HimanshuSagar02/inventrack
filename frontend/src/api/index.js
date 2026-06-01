import axios from 'axios';

export const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Products ──
export const getProducts = async () => {
  const res = await api.get('/products');
  return res.data;
};

export const createProduct = async (data) => {
  const res = await api.post('/products', data);
  return res.data;
};

export const updateProduct = async (id, data) => {
  const res = await api.put(`/products/${id}`, data);
  return res.data;
};

export const deleteProduct = async (id) => {
  await api.delete(`/products/${id}`);
};

export const uploadProductImage = async (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post(`${BASE_URL}/products/${id}/upload-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// ── Customers ──
export const getCustomers = async () => {
  const res = await api.get('/customers');
  return res.data;
};

export const createCustomer = async (data) => {
  const res = await api.post('/customers', data);
  return res.data;
};

export const deleteCustomer = async (id) => {
  await api.delete(`/customers/${id}`);
};

// ── Orders ──
export const getOrders = async () => {
  const res = await api.get('/orders');
  return res.data;
};

export const createOrder = async (data) => {
  const res = await api.post('/orders', data);
  return res.data;
};

export const deleteOrder = async (id) => {
  await api.delete(`/orders/${id}`);
};

// ── Analytics ──
export const getAnalytics = async () => {
  const res = await api.get('/analytics');
  return res.data;
};

export default api;
