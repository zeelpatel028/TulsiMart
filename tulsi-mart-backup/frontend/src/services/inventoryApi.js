import apiClient from './api';

export const inventoryApi = {
  getInventory: async (params = {}) => {
    return await apiClient.get('/inventory/', { params });
  },

  getStockMovements: async (params = {}) => {
    return await apiClient.get('/inventory/movements/', { params });
  },

  adjustStock: async (data) => {
    return await apiClient.post('/inventory/adjust/', data);
  }
};

export default inventoryApi;
