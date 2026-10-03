import apiClient, { clearApiCache } from '../api/axios';

export const bankApi = {
  getTransactions: (params = {}, config = {}) => {
    return apiClient.get('/core/bank-transactions/', { params, ...config });
  },

  createTransaction: async (data, config = {}) => {
    clearApiCache('/core/bank-transactions');
    return await apiClient.post('/core/bank-transactions/', data, config);
  },

  getSummary: (config = {}) => {
    return apiClient.get('/core/bank-transactions/summary/', config);
  },
};

export default bankApi;
