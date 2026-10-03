import apiClient, { cachedGet, clearApiCache } from '../api/axios';

export const inventoryApi = {
  getCategories: (config = {}) => cachedGet('/inventory/categories/', config, 60000),
  createCategory: async (data, config = {}) => {
    clearApiCache('/inventory/categories');
    return await apiClient.post('/inventory/categories/', data, config);
  },

  getBrands: (config = {}) => cachedGet('/inventory/brands/', config, 60000),
  createBrand: async (data, config = {}) => {
    clearApiCache('/inventory/brands');
    return await apiClient.post('/inventory/brands/', data, config);
  },

  getUnits: (config = {}) => cachedGet('/inventory/units/', config, 60000),
  createUnit: async (data, config = {}) => {
    clearApiCache('/inventory/units');
    return await apiClient.post('/inventory/units/', data, config);
  },

  getProducts: (params = {}, config = {}) => {
    return cachedGet('/inventory/products/', { params, ...config }, 10000);
  },

  getProduct: (id, config = {}) => {
    return cachedGet(`/inventory/products/${id}/`, config, 10000);
  },

  getNextProductId: (config = {}) => {
    return apiClient.get('/inventory/products/next_id/', config);
  },

  createProduct: async (data, config = {}) => {
    clearApiCache('/inventory/products');
    return await apiClient.post('/inventory/products/', data, config);
  },

  updateProduct: async (id, data, config = {}) => {
    clearApiCache('/inventory/products');
    return await apiClient.put(`/inventory/products/${id}/`, data, config);
  },

  deleteProduct: async (id, config = {}) => {
    clearApiCache('/inventory/products');
    return await apiClient.delete(`/inventory/products/${id}/`, config);
  },

  adjustStock: async (id, data, config = {}) => {
    clearApiCache('/inventory/products');
    return await apiClient.post(`/inventory/products/${id}/adjust_stock/`, data, config);
  },

  bulkUploadProducts: async (formData, config = {}) => {
    clearApiCache('/inventory/products');
    return await apiClient.post('/inventory/products/bulk_upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config
    });
  },

  getStockMovements: (params = {}, config = {}) => {
    return apiClient.get('/inventory/movements/', { params, ...config });
  },

  // Helper alias for getProducts
  getInventory: (params = {}, config = {}) => {
    return cachedGet('/inventory/products/', { params, ...config }, 10000);
  }
};

export default inventoryApi;
