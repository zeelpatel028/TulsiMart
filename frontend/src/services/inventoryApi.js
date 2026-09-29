import apiClient from './api';

export const inventoryApi = {
  getInventory: async (params = {}) => {
    return await apiClient.get('/inventory/products/', { params });
  },

  getStockMovements: async (params = {}) => {
    return await apiClient.get('/inventory/movements/', { params });
  },

  adjustStock: async (id, data) => {
    return await apiClient.post(`/inventory/products/${id}/adjust_stock/`, data);
  }
};

export default inventoryApi;

