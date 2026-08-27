import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_BASE_URL;
let API_BASE_URL;

if (rawApiUrl) {
  const cleanUrl = rawApiUrl.trim().replace(/\/+$/, '');
  API_BASE_URL = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
} else if (import.meta.env.DEV) {
  API_BASE_URL = 'http://127.0.0.1:8000/api';
} else {
  API_BASE_URL = 'https://tulsimart.onrender.com/api';
}



const apiClient = axios.create({
  baseURL: API_BASE_URL,
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

// Response interceptor for token expiration handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url?.includes('/core/auth/login/') ||
                          originalRequest?.url?.includes('/core/auth/verify-otp/') ||
                          originalRequest?.url?.includes('/core/auth/refresh/');

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
    }
    return Promise.reject(error);
  }
);

export default apiClient;
