import apiClient from './api';

export const reportApi = {
  getReportData: async (reportType, params = {}) => {
    return await apiClient.get('/analytics/reports/', { params: { type: reportType, ...params } });
  },

  getDashboardStats: async () => {
    return await apiClient.get('/analytics/dashboard-summary/');
  }
};

export default reportApi;

