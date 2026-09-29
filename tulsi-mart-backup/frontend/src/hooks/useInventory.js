import { useState, useCallback } from 'react';
import inventoryApi from '../services/inventoryApi';

export const useInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInventory = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryApi.getInventory(params);
      setInventory(data.results || data);
    } catch (err) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  return { inventory, loading, error, fetchInventory };
};

export default useInventory;
