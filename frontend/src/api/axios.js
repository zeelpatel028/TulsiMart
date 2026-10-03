import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
let API_BASE_URL;

if (import.meta.env.PROD) {
  // In production, strictly use configured environment variable or deployed Render backend URL
  let prodUrl = (rawApiUrl && !rawApiUrl.includes('localhost') && !rawApiUrl.includes('127.0.0.1'))
    ? rawApiUrl.trim().replace(/\/+$/, '')
    : 'https://tulsimart.onrender.com/api';

  // Prevent mixed-content errors when frontend is served over HTTPS
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && prodUrl.startsWith('http:')) {
    prodUrl = prodUrl.replace(/^http:/, 'https:');
  }

  API_BASE_URL = prodUrl.endsWith('/api') ? prodUrl : `${prodUrl}/api`;
} else {
  // Local development mode - automatically match host (localhost vs 127.0.0.1)
  if (rawApiUrl) {
    let cleanUrl = rawApiUrl.trim().replace(/\/+$/, '');
    if (typeof window !== 'undefined' && window.location.hostname) {
      if (cleanUrl.includes('localhost')) {
        cleanUrl = cleanUrl.replace('localhost', window.location.hostname);
      } else if (cleanUrl.includes('127.0.0.1')) {
        cleanUrl = cleanUrl.replace('127.0.0.1', window.location.hostname);
      }
    }
    API_BASE_URL = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  } else {
    const host = (typeof window !== 'undefined' && window.location.hostname) || '127.0.0.1';
    API_BASE_URL = `http://${host}:8000/api`;
  }
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Memory cache & In-flight request deduplication store
const apiCache = new Map();
const inFlightRequests = new Map();

/**
 * Clear memory cache by key prefix or purge all
 * @param {string} [prefix] 
 */
export const clearApiCache = (prefix = '') => {
  if (!prefix) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.startsWith(prefix)) {
      apiCache.delete(key);
    }
  }
};

// Request interceptor for JWT token, timing metrics, and cache/dedup check
apiClient.interceptors.request.use(
  (config) => {
    config._startTime = performance.now();
    const token = localStorage.getItem('tm_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Cached / Deduplicated GET wrapper
export const cachedGet = async (url, config = {}, cacheTtlMs = 15000) => {
  const method = (config.method || 'get').toLowerCase();
  if (method !== 'get') {
    return apiClient.get(url, config);
  }

  const cacheKey = `${url}?${JSON.stringify(config.params || {})}`;

  // 1. Check cache validity
  if (cacheTtlMs > 0 && apiCache.has(cacheKey)) {
    const entry = apiCache.get(cacheKey);
    if (Date.now() - entry.timestamp < cacheTtlMs) {
      return Promise.resolve(entry.data);
    }
    apiCache.delete(cacheKey);
  }

  // 2. Check in-flight request deduplication
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  // 3. Initiate request and deduplicate
  const requestPromise = apiClient.get(url, config)
    .then((response) => {
      if (cacheTtlMs > 0) {
        apiCache.set(cacheKey, { timestamp: Date.now(), data: response });
      }
      return response;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

// Response interceptor for token expiration, dev timing logger, and retry handling
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV && response.config._startTime) {
      const duration = Math.round(performance.now() - response.config._startTime);
      const url = response.config.url || '';
      const method = (response.config.method || 'get').toUpperCase();
      console.log(`[API] ${method} ${url} ${response.status} - ${duration}ms`);
    }
    return response;
  },
  async (error) => {
    if (axios.isCancel(error) || error?.name === 'CanceledError' || error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    if (import.meta.env.DEV && originalRequest._startTime) {
      const duration = Math.round(performance.now() - originalRequest._startTime);
      const url = originalRequest.url || '';
      const method = (originalRequest.method || 'get').toUpperCase();
      const status = error.response ? error.response.status : 'TIMEOUT/NETWORK_ERR';
      console.warn(`[API FAILED] ${method} ${url} ${status} - ${duration}ms`);
    }

    // Invalidate cache on mutations (POST, PUT, PATCH, DELETE)
    const method = (originalRequest.method || 'get').toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      clearApiCache();
    }

    const isAuthEndpoint = originalRequest.url?.includes('/core/auth/login/') ||
                          originalRequest.url?.includes('/core/auth/verify-otp/') ||
                          originalRequest.url?.includes('/core/auth/refresh/');

    // 1. JWT 401 Refresh Handling
    if (error.response && error.response.status === 401 && !isAuthEndpoint && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('tm_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/core/auth/refresh/`, { refresh: refreshToken });
          if (res.data?.access) {
            localStorage.setItem('tm_access_token', res.data.access);
            if (res.data?.refresh) {
              localStorage.setItem('tm_refresh_token', res.data.refresh);
            }
            originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
            return apiClient(originalRequest);
          }
        } catch (refreshErr) {
          console.warn('[JWT Auth] Refresh token expired or invalid.');
        }
      }

      // Clear invalid credentials for expired tokens on protected routes
      localStorage.removeItem('tm_access_token');
      localStorage.removeItem('tm_refresh_token');
      localStorage.removeItem('tm_user');
      localStorage.removeItem('tm_permissions');
      localStorage.removeItem('tm_store_settings');
      
      // If not on login page, redirect cleanly to login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // 2. Cold-start network retry logic ONLY for safe GET requests
    const isTimeout = error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'));
    const isNetworkErr = error.code === 'ERR_NETWORK' || !error.response || (error.message && error.message.toLowerCase().includes('network error'));
    const isNetworkOrColdStart = isNetworkErr || isTimeout || [502, 503, 504, 524].includes(error.response?.status);
    const isGetMethod = (originalRequest.method || 'get').toLowerCase() === 'get';

    if (isNetworkOrColdStart && isGetMethod) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      if (originalRequest._retryCount <= 2) {
        const retryDelay = originalRequest._retryCount * 1200;
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return apiClient(originalRequest);
      }
    }

    // For non-GET transactional requests (POST, PUT, PATCH, DELETE), NEVER auto-retry to prevent duplication
    return Promise.reject(error);
  }
);

export default apiClient;


