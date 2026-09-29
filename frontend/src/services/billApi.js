import apiClient from './api';

export const billApi = {
  getBills: async (params = {}) => {
    return await apiClient.get('/orders/orders/', { params });
  },

  getBillDetails: async (id) => {
    return await apiClient.get(`/orders/orders/${id}/`);
  },

  createBill: async (orderData) => {
    return await apiClient.post('/orders/orders/', orderData);
  },

  cancelBill: async (id, data = {}) => {
    return await apiClient.post(`/orders/orders/${id}/update_status/`, { status: 'CANCELLED', ...data });
  },

  getTodayCollection: async () => {
    return await apiClient.get('/core/gulla/');
  }
};

export default billApi;

