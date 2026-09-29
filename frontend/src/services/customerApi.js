import apiClient from './api';

export const customerApi = {
  getCustomers: async (params = {}) => {
    return await apiClient.get('/customers/customers/', { params });
  },

  getCustomer: async (id) => {
    return await apiClient.get(`/customers/customers/${id}/`);
  },

  createCustomer: async (data) => {
    return await apiClient.post('/customers/customers/', data);
  },

  updateCustomer: async (id, data) => {
    return await apiClient.put(`/customers/customers/${id}/`, data);
  },

  deleteCustomer: async (id) => {
    return await apiClient.delete(`/customers/customers/${id}/`);
  }
};

export default customerApi;

