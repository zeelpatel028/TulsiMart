import apiClient, { clearApiCache } from '../api/axios';

export const customerApi = {
  getCustomers: (params = {}, config = {}) => {
    return apiClient.get('/customers/customers/', { params, ...config });
  },

  getCustomer: (id, config = {}) => {
    return apiClient.get(`/customers/customers/${id}/`, config);
  },

  createCustomer: async (data, config = {}) => {
    clearApiCache('/customers');
    return await apiClient.post('/customers/customers/', data, config);
  },

  updateCustomer: async (id, data, config = {}) => {
    clearApiCache('/customers');
    return await apiClient.put(`/customers/customers/${id}/`, data, config);
  },

  deleteCustomer: async (id, config = {}) => {
    clearApiCache('/customers');
    return await apiClient.delete(`/customers/customers/${id}/`, config);
  },

  toggleCustomerBlock: async (id, config = {}) => {
    clearApiCache('/customers');
    return await apiClient.post(`/customers/customers/${id}/toggle_block/`, {}, config);
  },

  getCustomerHistory: (id, params = {}, config = {}) => {
    return apiClient.get(`/customers/customers/${id}/purchase_history/`, { params, ...config });
  },

  toggleBillPaymentStatus: async (id, data, config = {}) => {
    clearApiCache('/customers');
    return await apiClient.post(`/customers/customers/${id}/toggle_bill_payment_status/`, data, config);
  },

  recordKhataPayment: async (id, data, config = {}) => {
    clearApiCache('/customers');
    return await apiClient.post(`/customers/customers/${id}/khata_payment/`, data, config);
  },

  addCustomerFeedback: (id, data, config = {}) => {
    return apiClient.post(`/customers/customers/${id}/add_feedback/`, data, config);
  },

  getFeedbacks: (config = {}) => {
    return apiClient.get('/customers/feedback/', config);
  },
};

export default customerApi;
