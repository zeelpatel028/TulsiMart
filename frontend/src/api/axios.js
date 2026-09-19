import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
let API_BASE_URL;

if (import.meta.env.PROD) {
  // In production, strictly use configured environment variable or deployed Render backend URL
  const prodUrl = (rawApiUrl && !rawApiUrl.includes('localhost') && !rawApiUrl.includes('127.0.0.1'))
    ? rawApiUrl.trim().replace(/\/+$/, '')
    : 'https://tulsimart.onrender.com/api';
  API_BASE_URL = prodUrl.endsWith('/api') ? prodUrl : `${prodUrl}/api`;
} else {
  // Local development mode
  if (rawApiUrl) {
    const cleanUrl = rawApiUrl.trim().replace(/\/+$/, '');
    API_BASE_URL = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  } else {
    API_BASE_URL = 'http://127.0.0.1:8000/api';
  }
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tm_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token expiration and cold-start retry handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

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
    const isNetworkOrColdStart = !error.response || [502, 503, 504, 524].includes(error.response.status);
    const isGetMethod = (originalRequest.method || 'get').toLowerCase() === 'get';

    if (isNetworkOrColdStart && isGetMethod) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      if (originalRequest._retryCount <= 2) {
        // Wait 2.5s for Render backend instance to complete cold-start boot
        await new Promise((resolve) => setTimeout(resolve, 2500));
        return apiClient(originalRequest);
      }
    }

    // For non-GET transactional requests (POST, PUT, PATCH, DELETE), NEVER auto-retry to prevent duplication
    return Promise.reject(error);
  }
);

export default apiClient;

