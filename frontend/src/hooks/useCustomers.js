import { useState, useCallback } from 'react';
import customerApi from '../services/customerApi';
import { extractList } from '../utils/apiHelpers';

export const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCustomers = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerApi.getCustomers(params);
      setCustomers(extractList(data));
    } catch (err) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  return { customers, loading, error, fetchCustomers };
};

export default useCustomers;

