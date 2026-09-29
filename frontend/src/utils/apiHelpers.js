/**
 * Universal safe helper to extract array list from diverse API response structures
 * (FastAPI envelope, DRF, Axios wrapped, nested keys, direct array)
 */
export const extractList = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;

  // Direct object level
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.records)) return response.records;
  if (Array.isArray(response?.history)) return response.history;

  // Nested under response.data (FastAPI Envelope)
  if (response?.data && typeof response.data === 'object') {
    if (Array.isArray(response.data.data)) return response.data.data;
    if (Array.isArray(response.data.results)) return response.data.results;
    if (Array.isArray(response.data.items)) return response.data.items;
    if (Array.isArray(response.data.records)) return response.data.records;
    if (Array.isArray(response.data.history)) return response.data.history;
  }

  return [];
};

/**
 * Safe helper to format unit object or ID into string label for React JSX
 */
export const formatUnit = (unitVal, unitsList = []) => {
  if (!unitVal) return 'pc';
  if (typeof unitVal === 'object') {
    const label =
      (typeof unitVal.short_name === 'string' && unitVal.short_name) ||
      (typeof unitVal.name === 'string' && unitVal.name) ||
      (typeof unitVal.unit_name === 'string' && unitVal.unit_name) ||
      (typeof unitVal.base_unit === 'string' && unitVal.base_unit);
    if (label) return label;
  }
  if (Array.isArray(unitsList) && unitsList.length > 0) {
    const found = unitsList.find(u => u && (String(u.id) === String(unitVal) || u.short_name === unitVal || u.name === unitVal));
    if (found?.short_name) return found.short_name;
    if (found?.name) return found.name;
  }
  if (typeof unitVal === 'string' && isNaN(Number(unitVal))) return unitVal;
  return 'pc';
};

/**
 * Safe helper to format category object or ID into string label for React JSX
 */
export const formatCategory = (catVal, categoriesList = []) => {
  if (!catVal) return 'General';
  if (typeof catVal === 'object') {
    const label =
      (typeof catVal.name === 'string' && catVal.name) ||
      (typeof catVal.title === 'string' && catVal.title) ||
      (typeof catVal.category_name === 'string' && catVal.category_name);
    if (label) return label;
  }
  if (Array.isArray(categoriesList) && categoriesList.length > 0) {
    const found = categoriesList.find(c => c && (String(c.id) === String(catVal) || c.name === catVal || c.slug === catVal));
    if (found?.name) return found.name;
  }
  if (typeof catVal === 'string' && isNaN(Number(catVal))) return catVal;
  return 'General';
};

/**
 * Safe helper to format customer object into string label for React JSX
 */
export const formatCustomer = (custVal) => {
  if (!custVal) return 'Walk-in Customer';
  if (typeof custVal === 'string') return custVal;
  if (typeof custVal === 'object') {
    return custVal.name || custVal.full_name || custVal.phone || 'Walk-in Customer';
  }
  return 'Walk-in Customer';
};

/**
 * Safe helper to format supplier object into string label for React JSX
 */
export const formatSupplier = (suppVal) => {
  if (!suppVal) return 'General Supplier';
  if (typeof suppVal === 'string') return suppVal;
  if (typeof suppVal === 'object') {
    return suppVal.name || suppVal.company_name || 'General Supplier';
  }
  return 'General Supplier';
};
