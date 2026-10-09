import apiClient, { clearApiCache } from '../api/axios';

export const gullaApi = {
  getGullaSummary: (params = {}, config = {}) => {
    const finalConfig = typeof params === 'string' 
      ? { params: { date: params }, ...config } 
      : (params ? { params, ...config } : config);
    return apiClient.get('/core/gulla/', finalConfig);
  },

  createGullaEntry: async (data, config = {}) => {
    clearApiCache('/core/gulla');
    return await apiClient.post('/core/gulla/entry/', data, config);
  },

  calculateNotes: (data, config = {}) => {
    return apiClient.post('/core/gulla/calculate-notes/', data, config);
  },

  eodSweep: async (data, config = {}) => {
    clearApiCache('/core/gulla');
    return await apiClient.post('/core/gulla/eod-sweep/', data, config);
  },

  deleteGullaEntry: async (id, config = {}) => {
    clearApiCache('/core/gulla');
    return await apiClient.delete(`/core/gulla/entry/${id}/`, config);
  },
};

export default gullaApi;
