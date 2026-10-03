import apiClient, { cachedGet, clearApiCache } from '../api/axios';

export const supplierApi = {
  getSuppliers: (params = {}, config = {}) => {
    return cachedGet('/suppliers/suppliers/', { params, ...config }, 30000);
  },

  getSupplier: (id, config = {}) => {
    return apiClient.get(`/suppliers/suppliers/${id}/`, config);
  },

  createSupplier: async (data, config = {}) => {
    clearApiCache('/suppliers');
    return await apiClient.post('/suppliers/suppliers/', data, config);
  },

  updateSupplier: async (id, data, config = {}) => {
    clearApiCache('/suppliers');
    return await apiClient.put(`/suppliers/suppliers/${id}/`, data, config);
  },

  deleteSupplier: async (id, config = {}) => {
    clearApiCache('/suppliers');
    return await apiClient.delete(`/suppliers/suppliers/${id}/`, config);
  },

  getPurchaseOrders: (params = {}, config = {}) => {
    return apiClient.get('/suppliers/purchase-orders/', { params, ...config });
  },

  createPurchaseOrder: async (data, config = {}) => {
    clearApiCache('/suppliers');
    return await apiClient.post('/suppliers/purchase-orders/', data, config);
  },

  updatePOStatus: async (id, statusOrData, items, config = {}) => {
    clearApiCache('/suppliers');
    const payload = typeof statusOrData === 'object' ? statusOrData : { status: statusOrData, items: items || [] };
    return await apiClient.post(`/suppliers/purchase-orders/${id}/update_status/`, payload, config);
  },

  getSupplierPayments: (params = {}, config = {}) => {
    return apiClient.get('/suppliers/payments/', { params, ...config });
  },

  createSupplierPayment: async (data, config = {}) => {
    clearApiCache('/suppliers');
    return await apiClient.post('/suppliers/payments/', data, config);
  },
};

export default supplierApi;
