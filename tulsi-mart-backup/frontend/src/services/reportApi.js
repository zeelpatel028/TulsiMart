import apiClient from './api';

export const reportApi = {
  getReportData: async (reportType, params = {}) => {
    return await apiClient.get(`/reports/${reportType}/`, { params });
  },

  getDashboardStats: async () => {
    return await apiClient.get('/analytics/dashboard/');
  }
};

export default reportApi;
