import apiClient from './api';

export const expenseApi = {
  getExpenses: async (params = {}) => {
    return await apiClient.get('/expenses/expenses/', { params });
  },

  createExpense: async (data) => {
    return await apiClient.post('/expenses/expenses/', data);
  },

  deleteExpense: async (id) => {
    return await apiClient.delete(`/expenses/expenses/${id}/`);
  },

  getCategories: async () => {
    return await apiClient.get('/expenses/categories/');
  }
};

export default expenseApi;

