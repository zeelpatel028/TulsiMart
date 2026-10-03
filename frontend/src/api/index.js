import apiClient, { cachedGet, clearApiCache } from './axios';

export { clearApiCache };

// Services re-exports
export { storeSettingsApi, storeSettingsApi as settingsApi } from '../services/storeSettingsApi';
export { customerApi, customerApi as customersApi } from '../services/customerApi';
export { ordersApi } from '../services/ordersApi';
export { gullaApi } from '../services/gullaApi';
export { offerApi, offerApi as offersApi } from '../services/offerApi';
export { staffApi } from '../services/staffApi';
export { analyticsApi } from '../services/analyticsApi';
export { bankApi } from '../services/bankApi';
export { homeCashApi } from '../services/homeCashApi';
export { authApi } from '../services/authApi';
export { billApi } from '../services/billApi';
export { expenseApi, expenseApi as expensesApi } from '../services/expenseApi';
export { inventoryApi } from '../services/inventoryApi';
export { productApi, productApi as productsApi } from '../services/productApi';
export { reportApi, reportApi as reportsApi } from '../services/reportApi';
export { salesApi } from '../services/salesApi';
export { supplierApi, supplierApi as suppliersApi } from '../services/supplierApi';

// Login Accounts API
export const loginAccountsApi = {
  getAccounts: (params, config = {}) => apiClient.get('/core/login-accounts/', { params, ...config }),
  createAccount: (data) => apiClient.post('/core/login-accounts/', data),
  updateAccount: (id, data) => apiClient.put(`/core/login-accounts/${id}/`, data),
  deleteAccount: (id) => apiClient.delete(`/core/login-accounts/${id}/`),
  toggleAccountStatus: (id) => apiClient.post(`/core/login-accounts/${id}/toggle_status/`),
  toggleAccountOtp: (id) => apiClient.post(`/core/login-accounts/${id}/toggle_otp/`),
};

// Health Check API
export const healthApi = {
  check: () => apiClient.get('/health/'),
};
