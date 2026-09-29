import { useState, useEffect, useCallback } from 'react';
import productApi from '../services/productApi';

export const useProducts = (initialParams = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total_count: 0 });

  const fetchProducts = useCallback(async (params = initialParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await productApi.getProducts(params);
      if (response.results) {
        setProducts(response.results);
        setPagination({
          page: response.page || 1,
          total_pages: response.total_pages || 1,
          total_count: response.count || response.results.length,
        });
      } else {
        setProducts(Array.isArray(response) ? response : []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  return { products, loading, error, pagination, fetchProducts };
};

export default useProducts;
