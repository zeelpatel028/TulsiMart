import apiClient, { clearApiCache } from '../api/axios';

export const ordersApi = {
  getOrders: (params = {}, config = {}) => {
    return apiClient.get('/orders/orders/', { params, ...config });
  },

  getOrder: (id, config = {}) => {
    return apiClient.get(`/orders/orders/${id}/`, config);
  },

  createOrder: async (data, config = {}) => {
    clearApiCache('/orders');
    return await apiClient.post('/orders/orders/', data, config);
  },

  updateOrderStatus: async (id, data, config = {}) => {
    clearApiCache('/orders');
    return await apiClient.post(`/orders/orders/${id}/update_status/`, data, config);
  },

  togglePaymentStatus: async (id, data, config = {}) => {
    clearApiCache('/orders');
    return await apiClient.post(`/orders/orders/${id}/toggle_payment_status/`, data, config);
  },

  getInvoiceDetails: (id, config = {}) => {
    return apiClient.get(`/orders/orders/${id}/invoice_details/`, config);
  },

  getPayments: (params = {}, config = {}) => {
    return apiClient.get('/orders/payments/', { params, ...config });
  },
};

export default ordersApi;
