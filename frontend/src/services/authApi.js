import apiClient from './api';

export const authApi = {
  login: async (credentials) => {
    return await apiClient.post('/auth/login/', credentials);
  },

  verifyOtp: async (data) => {
    return await apiClient.post('/auth/verify-otp/', data);
  },

  getCurrentUser: async () => {
    return await apiClient.get('/auth/me/');
  },

  logout: async () => {
    return await apiClient.post('/auth/logout/');
  }
};

export default authApi;
