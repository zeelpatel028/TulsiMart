// Client-side in-memory cache for static/semi-static metadata & table queries
// Reduces repeated duplicate API requests to Render/Aiven during page navigation.

const cache = new Map();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const getCachedData = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data;
};

export const setCachedData = (key, data, ttlMs = DEFAULT_TTL_MS) => {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
};

export const fetchWithCache = async (key, fetchFn, ttlMs = DEFAULT_TTL_MS) => {
  const cached = getCachedData(key);
  if (cached) {
    return cached;
  }
  const result = await fetchFn();
  setCachedData(key, result, ttlMs);
  return result;
};

export const invalidateCache = (prefix = null) => {
  if (prefix) {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};
