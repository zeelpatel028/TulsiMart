import apiClient from './api';

export const expenseApi = {
  getExpenses: async (params = {}) => {
    return await apiClient.get('/expenses/', { params });
  },

  createExpense: async (data) => {
    return await apiClient.post('/expenses/', data);
  },

  deleteExpense: async (id) => {
    return await apiClient.delete(`/expenses/${id}/`);
  },

  getCategories: async () => {
    return await apiClient.get('/expenses/categories/');
  }
};

export default expenseApi;
