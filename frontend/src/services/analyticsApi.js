import apiClient, { cachedGet } from '../api/axios';

export const analyticsApi = {
  getDashboardSummary: (config = {}) => {
    return cachedGet('/analytics/dashboard-summary/', config, 10000);
  },

  getSalesTrends: (params = {}, config = {}) => {
    return apiClient.get('/analytics/sales-trends/', { params, ...config });
  },

  getReports: (params = {}, config = {}) => {
    return apiClient.get('/analytics/reports/', { params, ...config });
  },
};

export default analyticsApi;
