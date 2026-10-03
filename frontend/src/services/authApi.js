import apiClient, { cachedGet } from '../api/axios';
import { staffApi } from './staffApi';

export const authApi = {
  login: async (credentials) => {
    return await apiClient.post('/core/auth/login/', credentials);
  },

  sendOtp: async (data) => {
    return await apiClient.post('/core/auth/login/', data);
  },

  verifyOtp: async (data) => {
    return await apiClient.post('/core/auth/verify-otp/', data);
  },

  getCurrentUser: async () => {
    return await apiClient.get('/core/auth/me/');
  },

  getMe: async () => {
    return cachedGet('/core/auth/me/', {}, 30000);
  },

  getSettings: async () => {
    return cachedGet('/core/settings/', {}, 60000);
  },

  logout: async () => {
    localStorage.removeItem('tm_access_token');
    localStorage.removeItem('tm_refresh_token');
    localStorage.removeItem('tm_user');
    return { success: true };
  },

  // Staff & Activity Logs helpers
  getStaff: (params = {}, config = {}) => staffApi.getStaff(params, config),
  createStaff: (data, config = {}) => staffApi.createStaff(data, config),
  updateStaff: (id, data, config = {}) => staffApi.updateStaff(id, data, config),
  deleteStaff: (id, config = {}) => staffApi.deleteStaff(id, config),
  toggleStaffStatus: (id, config = {}) => staffApi.toggleStaffStatus(id, config),
  updateStaffAttendance: (id, attendance_data, config = {}) => staffApi.updateStaffAttendance(id, attendance_data, config),
  getActivityLogs: (params = {}, config = {}) => staffApi.getActivityLogs(params, config),
};

export default authApi;
