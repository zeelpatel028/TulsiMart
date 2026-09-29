import apiClient from './api';

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
    return await apiClient.get('/core/auth/me/');
  },

  logout: async () => {
    localStorage.removeItem('tm_access_token');
    localStorage.removeItem('tm_refresh_token');
    localStorage.removeItem('tm_user');
    return { success: true };
  }
};

export default authApi;

