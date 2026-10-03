import apiClient, { cachedGet, clearApiCache } from '../api/axios';
import { inventoryApi } from './inventoryApi';

export const productApi = {
  getProducts: (params = {}, config = {}) => inventoryApi.getProducts(params, config),
  getProduct: (id, config = {}) => inventoryApi.getProduct(id, config),
  getNextProductId: (config = {}) => inventoryApi.getNextProductId(config),
  createProduct: (data, config = {}) => inventoryApi.createProduct(data, config),
  updateProduct: (id, data, config = {}) => inventoryApi.updateProduct(id, data, config),
  deleteProduct: (id, config = {}) => inventoryApi.deleteProduct(id, config),
  adjustStock: (id, data, config = {}) => inventoryApi.adjustStock(id, data, config),
  bulkUploadProducts: (formData, config = {}) => inventoryApi.bulkUploadProducts(formData, config),
  
  getCategories: (config = {}) => inventoryApi.getCategories(config),
  getBrands: (config = {}) => inventoryApi.getBrands(config),
  getUnits: (config = {}) => inventoryApi.getUnits(config),

  searchPOSProducts: (query = '', config = {}) => {
    return cachedGet('/inventory/products/', { params: { search: query, page_size: 100 }, ...config }, 5000);
  }
};

export default productApi;
