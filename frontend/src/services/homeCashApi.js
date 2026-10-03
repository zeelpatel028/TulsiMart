import apiClient, { clearApiCache } from '../api/axios';

export const homeCashApi = {
  getHomeCashData: (config = {}) => {
    return apiClient.get('/core/home-cash/', config);
  },

  createHomeCashTransaction: async (data, config = {}) => {
    clearApiCache('/core/home-cash');
    return await apiClient.post('/core/home-cash/', data, config);
  },
};

export default homeCashApi;
