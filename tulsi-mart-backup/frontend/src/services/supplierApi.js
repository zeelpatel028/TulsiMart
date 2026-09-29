import apiClient from './api';

export const supplierApi = {
  getSuppliers: async (params = {}) => {
    return await apiClient.get('/suppliers/', { params });
  },

  getSupplier: async (id) => {
    return await apiClient.get(`/suppliers/${id}/`);
  },

  createSupplier: async (data) => {
    return await apiClient.post('/suppliers/', data);
  },

  updateSupplier: async (id, data) => {
    return await apiClient.put(`/suppliers/${id}/`, data);
  },

  deleteSupplier: async (id) => {
    return await apiClient.delete(`/suppliers/${id}/`);
  },

  getPurchaseOrders: async (params = {}) => {
    return await apiClient.get('/suppliers/purchase-orders/', { params });
  },

  createPurchaseOrder: async (data) => {
    return await apiClient.post('/suppliers/purchase-orders/', data);
  }
};

export default supplierApi;
