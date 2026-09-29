import apiClient from './api';

export const salesApi = {
  getSalesSummary: async (params = {}) => {
    return await apiClient.get('/analytics/dashboard-summary/', { params });
  },

  getRevenueAnalytics: async (params = {}) => {
    return await apiClient.get('/analytics/sales-trends/', { params });
  }
};

export default salesApi;

