import apiClient, { clearApiCache } from '../api/axios';

export const storeSettingsApi = {
  getSettings: (config = {}) => {
    return apiClient.get('/core/settings/', config);
  },

  updateSettings: async (data, config = {}) => {
    clearApiCache('/core/settings');
    return await apiClient.put('/core/settings/', data, config);
  },

  patchSettings: async (data, config = {}) => {
    clearApiCache('/core/settings');
    return await apiClient.patch('/core/settings/', data, config);
  },

  // Login Accounts Management
  getAccounts: (params = {}, config = {}) => {
    return apiClient.get('/core/login-accounts/', { params, ...config });
  },

  createAccount: async (data, config = {}) => {
    return await apiClient.post('/core/login-accounts/', data, config);
  },

  updateAccount: async (id, data, config = {}) => {
    return await apiClient.put(`/core/login-accounts/${id}/`, data, config);
  },

  deleteAccount: async (id, config = {}) => {
    return await apiClient.delete(`/core/login-accounts/${id}/`, config);
  },

  toggleAccountStatus: async (id, config = {}) => {
    return await apiClient.post(`/core/login-accounts/${id}/toggle_status/`, {}, config);
  },

  toggleAccountOtp: async (id, config = {}) => {
    return await apiClient.post(`/core/login-accounts/${id}/toggle_otp/`, {}, config);
  },

  // Home Cash Safe Vault
  getHomeCashData: (config = {}) => {
    return apiClient.get('/core/home-cash/', config);
  },

  createHomeCashTransaction: async (data, config = {}) => {
    return await apiClient.post('/core/home-cash/', data, config);
  },

  // Bank & UPI Transactions
  getBankTransactions: (params = {}, config = {}) => {
    return apiClient.get('/core/bank-transactions/', { params, ...config });
  },

  createBankTransaction: async (data, config = {}) => {
    return await apiClient.post('/core/bank-transactions/', data, config);
  },

  getBankSummary: (config = {}) => {
    return apiClient.get('/core/bank-transactions/summary/', config);
  }
};

export default storeSettingsApi;
