import apiClient from './api';

export const productApi = {
  getProducts: async (params = {}) => {
    return await apiClient.get('/inventory/products/', { params });
  },

  searchPOSProducts: async (query = '') => {
    return await apiClient.get('/inventory/products/', { params: { search: query, page_size: 100 } });
  },

  getProduct: async (id) => {
    return await apiClient.get(`/inventory/products/${id}/`);
  },

  createProduct: async (data) => {
    return await apiClient.post('/inventory/products/', data);
  },

  updateProduct: async (id, data) => {
    return await apiClient.put(`/inventory/products/${id}/`, data);
  },

  deleteProduct: async (id) => {
    return await apiClient.delete(`/inventory/products/${id}/`);
  },

  getCategories: async () => {
    return await apiClient.get('/inventory/categories/');
  },

  getBrands: async () => {
    return await apiClient.get('/inventory/brands/');
  },

  getUnits: async () => {
    return await apiClient.get('/inventory/units/');
  }
};

export default productApi;

