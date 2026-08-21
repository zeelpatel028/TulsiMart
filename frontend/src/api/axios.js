import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

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
  (error) => {
    const isAuthEndpoint = error.config?.url?.includes('/core/auth/send-otp/') || 
                          error.config?.url?.includes('/core/auth/login/') ||
                          error.config?.url?.includes('/core/auth/verify-otp/');

    if (error.response && error.response.status === 401 && !isAuthEndpoint) {
      // Clear invalid credentials for expired tokens on protected routes
      localStorage.removeItem('tm_access_token');
      localStorage.removeItem('tm_refresh_token');
      localStorage.removeItem('tm_user');
      
      // If not on login page, redirect cleanly to login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
