import apiClient from './api';

export const salesApi = {
  getSalesSummary: async (params = {}) => {
    return await apiClient.get('/analytics/sales-summary/', { params });
  },

  getRevenueAnalytics: async (params = {}) => {
    return await apiClient.get('/analytics/revenue/', { params });
  }
};

export default salesApi;
