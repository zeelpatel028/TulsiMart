import apiClient from './axios';

// Store Settings API
export const settingsApi = {
  getSettings: () => apiClient.get('/core/settings/'),
  updateSettings: (data) => apiClient.put('/core/settings/', data),
  patchSettings: (data) => apiClient.patch('/core/settings/', data),
};

// Login Accounts API
export const loginAccountsApi = {
  getAccounts: (params) => apiClient.get('/core/login-accounts/', { params }),
  createAccount: (data) => apiClient.post('/core/login-accounts/', data),
  updateAccount: (id, data) => apiClient.put(`/core/login-accounts/${id}/`, data),
  deleteAccount: (id) => apiClient.delete(`/core/login-accounts/${id}/`),
  toggleAccountStatus: (id) => apiClient.post(`/core/login-accounts/${id}/toggle_status/`),
  toggleAccountOtp: (id) => apiClient.post(`/core/login-accounts/${id}/toggle_otp/`),
};


// Staff & System API
export const authApi = {
  login: (data) => apiClient.post('/core/auth/login/', data),
  sendOtp: (data) => apiClient.post('/core/auth/login/', data),
  verifyOtp: (data) => apiClient.post('/core/auth/verify-otp/', data),
  getMe: () => apiClient.get('/core/auth/me/'),
  getSettings: () => apiClient.get('/core/settings/'),

  getStaff: (params) => apiClient.get('/core/staff/', { params }),

  createStaff: (data) => apiClient.post('/core/staff/', data),
  updateStaff: (id, data) => apiClient.put(`/core/staff/${id}/`, data),
  deleteStaff: (id) => apiClient.delete(`/core/staff/${id}/`),
  toggleStaffStatus: (id) => apiClient.post(`/core/staff/${id}/toggle_status/`),
  updateStaffAttendance: (id, attendance_data) => apiClient.post(`/core/staff/${id}/update_attendance/`, { attendance_data }),
  getActivityLogs: (params) => apiClient.get('/core/logs/', { params }),
  getMongoStatus: () => apiClient.get('/core/mongodb/status/'),
  syncMongoDB: () => apiClient.post('/core/mongodb/sync/'),
};


// Inventory & Products API
export const inventoryApi = {
  getCategories: () => apiClient.get('/inventory/categories/'),
  createCategory: (data) => apiClient.post('/inventory/categories/', data),
  getBrands: () => apiClient.get('/inventory/brands/'),
  createBrand: (data) => apiClient.post('/inventory/brands/', data),
  getUnits: () => apiClient.get('/inventory/units/'),
  getProducts: (params) => apiClient.get('/inventory/products/', { params }),
  getProduct: (id) => apiClient.get(`/inventory/products/${id}/`),
  createProduct: (data) => apiClient.post('/inventory/products/', data),
  updateProduct: (id, data) => apiClient.put(`/inventory/products/${id}/`, data),
  deleteProduct: (id) => apiClient.delete(`/inventory/products/${id}/`),
  adjustStock: (id, data) => apiClient.post(`/inventory/products/${id}/adjust_stock/`, data),
  bulkUploadProducts: (formData) => apiClient.post('/inventory/products/bulk_upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getStockMovements: (params) => apiClient.get('/inventory/movements/', { params }),
};

// Orders API
export const ordersApi = {
  getOrders: (params) => apiClient.get('/orders/orders/', { params }),
  getOrder: (id) => apiClient.get(`/orders/orders/${id}/`),
  createOrder: (data) => apiClient.post('/orders/orders/', data),
  updateOrderStatus: (id, data) => apiClient.post(`/orders/orders/${id}/update_status/`, data),
  togglePaymentStatus: (id, data) => apiClient.post(`/orders/orders/${id}/toggle_payment_status/`, data),
  getInvoiceDetails: (id) => apiClient.get(`/orders/orders/${id}/invoice_details/`),
  getPayments: (params) => apiClient.get('/orders/payments/', { params }),
};

// Customers API
export const customersApi = {
  getCustomers: (params) => apiClient.get('/customers/customers/', { params }),
  getCustomer: (id) => apiClient.get(`/customers/customers/${id}/`),
  createCustomer: (data) => apiClient.post('/customers/customers/', data),
  updateCustomer: (id, data) => apiClient.put(`/customers/customers/${id}/`, data),
  toggleCustomerBlock: (id) => apiClient.post(`/customers/customers/${id}/toggle_block/`),
  getCustomerHistory: (id) => apiClient.get(`/customers/customers/${id}/purchase_history/`),
  toggleBillPaymentStatus: (id, data) => apiClient.post(`/customers/customers/${id}/toggle_bill_payment_status/`, data),
  recordKhataPayment: (id, data) => apiClient.post(`/customers/customers/${id}/khata_payment/`, data),
  addCustomerFeedback: (id, data) => apiClient.post(`/customers/customers/${id}/add_feedback/`, data),
  getFeedbacks: () => apiClient.get('/customers/feedback/'),
};


// Suppliers API
export const suppliersApi = {
  getSuppliers: (params) => apiClient.get('/suppliers/suppliers/', { params }),
  createSupplier: (data) => apiClient.post('/suppliers/suppliers/', data),
  updateSupplier: (id, data) => apiClient.put(`/suppliers/suppliers/${id}/`, data),
  getPurchaseOrders: (params) => apiClient.get('/suppliers/purchase-orders/', { params }),
  createPurchaseOrder: (data) => apiClient.post('/suppliers/purchase-orders/', data),
  updatePOStatus: (id, statusOrData, items) => {
    const payload = typeof statusOrData === 'object' ? statusOrData : { status: statusOrData, items: items || [] };
    return apiClient.post(`/suppliers/purchase-orders/${id}/update_status/`, payload);
  },
  getSupplierPayments: (params) => apiClient.get('/suppliers/payments/', { params }),
  createSupplierPayment: (data) => apiClient.post('/suppliers/payments/', data),
};

// Expenses API
export const expensesApi = {
  getCategories: () => apiClient.get('/expenses/categories/'),
  createCategory: (data) => apiClient.post('/expenses/categories/', data),
  getExpenses: (params) => apiClient.get('/expenses/expenses/', { params }),
  createExpense: (data) => apiClient.post('/expenses/expenses/', data),
  deleteExpense: (id) => apiClient.delete(`/expenses/expenses/${id}/`),
  getExpenseSummary: () => apiClient.get('/expenses/expenses/summary/'),
};

// Offers API
export const offersApi = {
  getCoupons: (params) => apiClient.get('/offers/coupons/', { params }),
  createCoupon: (data) => apiClient.post('/offers/coupons/', data),
  updateCoupon: (id, data) => apiClient.put(`/offers/coupons/${id}/`, data),
  deleteCoupon: (id) => apiClient.delete(`/offers/coupons/${id}/`),
  validateCoupon: (data) => apiClient.post('/offers/coupons/validate_code/', data),
  getFestivalOffers: () => apiClient.get('/offers/festival-offers/'),
  createFestivalOffer: (data) => apiClient.post('/offers/festival-offers/', data),
};

// Analytics & Reports API
export const analyticsApi = {
  getDashboardSummary: () => apiClient.get('/analytics/dashboard-summary/'),
  getSalesTrends: (params) => apiClient.get('/analytics/sales-trends/', { params }),
  getReports: (params) => apiClient.get('/analytics/reports/', { params }),
};

// Gulla (Cash Drawer / Register) API
export const gullaApi = {
  getGullaSummary: (params) => apiClient.get('/core/gulla/', { params }),
  createGullaEntry: (data) => apiClient.post('/core/gulla/entry/', data),
  calculateNotes: (data) => apiClient.post('/core/gulla/calculate-notes/', data),
  eodSweep: (data) => apiClient.post('/core/gulla/eod-sweep/', data),
};

// Bank & UPI Transactions API
export const bankApi = {
  getTransactions: (params) => apiClient.get('/core/bank-transactions/', { params }),
  createTransaction: (data) => apiClient.post('/core/bank-transactions/', data),
  getSummary: () => apiClient.get('/core/bank-transactions/summary/'),
};

// Home Safe Cash Vault API
export const homeCashApi = {
  getHomeCashData: () => apiClient.get('/core/home-cash/'),
  createHomeCashTransaction: (data) => apiClient.post('/core/home-cash/', data),
};

