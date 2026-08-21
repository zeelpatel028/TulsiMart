import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('tm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('tm_access_token') || null);
  const [storeSettings, setStoreSettings] = useState(() => {
    const saved = localStorage.getItem('tm_store_settings');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startTime = Date.now();
    const initAuth = async () => {
      const savedToken = localStorage.getItem('tm_access_token');
      if (savedToken) {
        try {
          const res = await authApi.getMe();
          setUser(res.data.user);
          setStoreSettings(res.data.store_settings);
          localStorage.setItem('tm_user', JSON.stringify(res.data.user));
          localStorage.setItem('tm_store_settings', JSON.stringify(res.data.store_settings));
        } catch (err) {
          console.warn('Invalid or expired session token, resetting auth state.');
          setUser(null);
          setToken(null);
          localStorage.removeItem('tm_access_token');
          localStorage.removeItem('tm_refresh_token');
          localStorage.removeItem('tm_user');
        }
      } else {
        setUser(null);
      }
      
      // Ensure splash loader stays for 5 seconds (5000ms) on site open / refresh
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 5000 - elapsedTime);
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    };

    initAuth();
  }, []);

  const sendOtp = async (username, password) => {
    try {
      const res = await authApi.sendOtp({ username, password });
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid username or password';
      return { success: false, error: msg };
    }
  };

  const verifyOtp = async (username, otp) => {
    try {
      const res = await authApi.verifyOtp({ username, otp });
      const { access, refresh, user: userData, store_settings: settings } = res.data;
      
      setToken(access);
      setUser(userData);
      setStoreSettings(settings);

      localStorage.setItem('tm_access_token', access);
      localStorage.setItem('tm_refresh_token', refresh);
      localStorage.setItem('tm_user', JSON.stringify(userData));
      localStorage.setItem('tm_store_settings', JSON.stringify(settings));

      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid OTP code';
      return { success: false, error: msg };
    }
  };

  const login = async (username, password) => {
    try {
      const res = await authApi.login({ username, password });
      const { access, refresh, user: userData, store_settings: settings } = res.data;
      
      setToken(access);
      setUser(userData);
      setStoreSettings(settings);

      localStorage.setItem('tm_access_token', access);
      localStorage.setItem('tm_refresh_token', refresh);
      localStorage.setItem('tm_user', JSON.stringify(userData));
      localStorage.setItem('tm_store_settings', JSON.stringify(settings));

      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid username or password';
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('tm_access_token');
    localStorage.removeItem('tm_refresh_token');
    localStorage.removeItem('tm_user');
  };

  const updateStoreSettings = (newSettings) => {
    setStoreSettings(newSettings);
    localStorage.setItem('tm_store_settings', JSON.stringify(newSettings));
  };

  // Role permissions checker
  const isRole = (roles) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true; // Admin has full access
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      storeSettings,
      loading,
      login,
      sendOtp,
      verifyOtp,
      logout,
      updateStoreSettings,
      isRole,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
