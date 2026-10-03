import apiClient, { cachedGet, clearApiCache } from '../api/axios';

export const expenseApi = {
  getCategories: (config = {}) => cachedGet('/expenses/categories/', config, 60000),
  createCategory: async (data, config = {}) => {
    clearApiCache('/expenses');
    return await apiClient.post('/expenses/categories/', data, config);
  },

  getExpenses: (params = {}, config = {}) => {
    return apiClient.get('/expenses/expenses/', { params, ...config });
  },

  createExpense: async (data, config = {}) => {
    clearApiCache('/expenses');
    return await apiClient.post('/expenses/expenses/', data, config);
  },

  deleteExpense: async (id, config = {}) => {
    clearApiCache('/expenses');
    return await apiClient.delete(`/expenses/expenses/${id}/`, config);
  },

  getExpenseSummary: (config = {}) => {
    return apiClient.get('/expenses/expenses/summary/', config);
  }
};

export default expenseApi;
