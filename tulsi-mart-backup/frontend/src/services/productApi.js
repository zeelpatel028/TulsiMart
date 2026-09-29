import apiClient from './api';

export const productApi = {
  getProducts: async (params = {}) => {
    return await apiClient.get('/products/', { params });
  },

  searchPOSProducts: async (query = '') => {
    return await apiClient.get('/products/pos_search/', { params: { q: query } });
  },

  getProduct: async (id) => {
    return await apiClient.get(`/products/${id}/`);
  },

  createProduct: async (data) => {
    return await apiClient.post('/products/', data);
  },

  updateProduct: async (id, data) => {
    return await apiClient.put(`/products/${id}/`, data);
  },

  deleteProduct: async (id) => {
    return await apiClient.delete(`/products/${id}/`);
  },

  getCategories: async () => {
    return await apiClient.get('/categories/');
  },

  getBrands: async () => {
    return await apiClient.get('/brands/');
  },

  getUnits: async () => {
    return await apiClient.get('/units/');
  }
};

export default productApi;
