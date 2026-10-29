import axios from 'axios';

// Use relative URL so nginx can proxy /api to backend container
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor for auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (name, email, password) => api.post('/api/auth/register', { name, email, password }),
  me: () => api.get('/api/auth/me'),
};

// Transactions
export const transactionAPI = {
  getAll: (params) => api.get('/api/transactions', { params }),
  getSummary: (params) => api.get('/api/transactions/summary', { params }),
  getOne: (id) => api.get(`/api/transactions/${id}`),
  create: (data) => api.post('/api/transactions', data),
  update: (id, data) => api.put(`/api/transactions/${id}`, data),
  delete: (id) => api.delete(`/api/transactions/${id}`),
};

// Categories
export const categoryAPI = {
  getAll: () => api.get('/api/categories'),
  create: (data) => api.post('/api/categories', data),
  update: (id, data) => api.put(`/api/categories/${id}`, data),
  delete: (id) => api.delete(`/api/categories/${id}`),
};

// Accounts
export const accountAPI = {
  getAll: () => api.get('/api/accounts'),
  getDefault: () => api.get('/api/accounts/default'),
  getOne: (id) => api.get(`/api/accounts/${id}`),
  create: (data) => api.post('/api/accounts', data),
  update: (id, data) => api.put(`/api/accounts/${id}`, data),
  delete: (id) => api.delete(`/api/accounts/${id}`),
};

// Recurring
export const recurringAPI = {
  getAll: () => api.get('/api/recurring'),
  getUpcoming: () => api.get('/api/recurring/upcoming'),
  getOne: (id) => api.get(`/api/recurring/${id}`),
  getProjection: (id) => api.get(`/api/recurring/${id}/projection`),
  create: (data) => api.post('/api/recurring', data),
  update: (id, data) => api.put(`/api/recurring/${id}`, data),
  toggle: (id) => api.patch(`/api/recurring/${id}/toggle`),
  delete: (id) => api.delete(`/api/recurring/${id}`),
};

// Budgets
export const budgetAPI = {
  getAll: (params) => api.get('/api/budgets', { params }),
  getSummary: () => api.get('/api/budgets/summary'),
  getOne: (id) => api.get(`/api/budgets/${id}`),
  create: (data) => api.post('/api/budgets', data),
  update: (id, data) => api.put(`/api/budgets/${id}`, data),
  delete: (id) => api.delete(`/api/budgets/${id}`),
};

// Insights
export const insightsAPI = {
  getSpendingComparison: (period) => api.get('/api/insights/spending-comparison', { params: { period } }),
  getMonthlyTrend: () => api.get('/api/insights/monthly-trend'),
  getCategoryBreakdown: (period) => api.get('/api/insights/category-breakdown', { params: { period } }),
  getAnomalies: (params) => api.get('/api/insights/anomalies', { params }),
  getRecurringImpact: () => api.get('/api/insights/recurring-impact'),
  getRecommendations: () => api.get('/api/insights/recommendations'),
  getIncomeExpense: (period) => api.get('/api/insights/income-expense', { params: { period } }),
};

// Safe to Spend
export const safeToSpendAPI = {
  calculate: (data) => api.post('/api/safe-to-spend/calculate', data),
  quick: () => api.get('/api/safe-to-spend/quick'),
};

// Import/Export
export const importExportAPI = {
  export: (params) => api.get('/api/import-export/export', { params, responseType: 'blob' }),
  import: (data) => api.post('/api/import-export/import', data),
  preview: (data) => api.post('/api/import-export/import/preview', data),
};

export default api;