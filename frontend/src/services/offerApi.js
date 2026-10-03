import apiClient, { cachedGet, clearApiCache } from '../api/axios';

export const offerApi = {
  getCoupons: (params = {}, config = {}) => {
    return cachedGet('/offers/coupons/', { params, ...config }, 30000);
  },

  createCoupon: async (data, config = {}) => {
    clearApiCache('/offers');
    return await apiClient.post('/offers/coupons/', data, config);
  },

  updateCoupon: async (id, data, config = {}) => {
    clearApiCache('/offers');
    return await apiClient.put(`/offers/coupons/${id}/`, data, config);
  },

  deleteCoupon: async (id, config = {}) => {
    clearApiCache('/offers');
    return await apiClient.delete(`/offers/coupons/${id}/`, config);
  },

  validateCoupon: (data, config = {}) => {
    return apiClient.post('/offers/coupons/validate_code/', data, config);
  },

  getFestivalOffers: (config = {}) => {
    return cachedGet('/offers/festival-offers/', config, 60000);
  },

  createFestivalOffer: async (data, config = {}) => {
    clearApiCache('/offers');
    return await apiClient.post('/offers/festival-offers/', data, config);
  },
};

export default offerApi;
