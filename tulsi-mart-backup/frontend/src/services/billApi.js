import apiClient from './api';

export const billApi = {
  getBills: async (params = {}) => {
    return await apiClient.get('/orders/', { params });
  },

  getBillDetails: async (id) => {
    return await apiClient.get(`/orders/${id}/`);
  },

  createBill: async (orderData) => {
    return await apiClient.post('/orders/', orderData);
  },

  cancelBill: async (id, reason = '') => {
    return await apiClient.post(`/orders/${id}/cancel/`, { reason });
  },

  getTodayCollection: async () => {
    return await apiClient.get('/gulla/today/');
  }
};

export default billApi;
