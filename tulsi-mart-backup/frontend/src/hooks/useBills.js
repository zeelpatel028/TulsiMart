import { useState, useCallback } from 'react';
import billApi from '../services/billApi';

export const useBills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBills = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await billApi.getBills(params);
      setBills(data.results || data);
    } catch (err) {
      setError(err.message || 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  }, []);

  return { bills, loading, error, fetchBills };
};

export default useBills;
