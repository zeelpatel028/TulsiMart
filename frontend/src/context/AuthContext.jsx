import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, settingsApi } from '../api';

const AuthContext = createContext(null);

const extractErrorMessage = (err, defaultMsg) => {
  if (!err.response?.data) return defaultMsg;
  const data = err.response.data;
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  if (data.username) return Array.isArray(data.username) ? data.username[0] : data.username;
  if (data.password) return Array.isArray(data.password) ? data.password[0] : data.password;
  if (data.non_field_errors) return Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
  return defaultMsg;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('tm_user');
    const token = localStorage.getItem('tm_access_token');
    return (saved && token) ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('tm_access_token') || null);
  const [storeSettings, setStoreSettings] = useState(() => {
    const saved = localStorage.getItem('tm_store_settings');
    return saved ? JSON.parse(saved) : null;
  });
  const [permissions, setPermissions] = useState(() => {
    const saved = localStorage.getItem('tm_permissions');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startTime = Date.now();
    const initAuth = async () => {
      // Always fetch live store settings from database
      try {
        const settingsRes = await settingsApi.getSettings();
        if (settingsRes.data) {
          setStoreSettings(settingsRes.data);
          localStorage.setItem('tm_store_settings', JSON.stringify(settingsRes.data));
        }
      } catch (err) {
        console.warn('Could not fetch store settings from API, using cached/default settings.', err);
      }

      const savedToken = localStorage.getItem('tm_access_token');
      if (savedToken) {
        try {
          const res = await authApi.getMe();
          setUser(res.data.user);
          if (res.data.store_settings) {
            setStoreSettings(res.data.store_settings);
            localStorage.setItem('tm_store_settings', JSON.stringify(res.data.store_settings));
          }
          if (res.data.permissions) {
            setPermissions(res.data.permissions);
            localStorage.setItem('tm_permissions', JSON.stringify(res.data.permissions));
          }
          localStorage.setItem('tm_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.warn('Invalid or expired session token, resetting auth state.');
        }
      }
      
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 500 - elapsedTime);
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    };

    initAuth();
  }, []);


  const sendOtp = async (username, password) => {
    try {
      const res = await authApi.sendOtp({ username, password });
      if (res.data && !res.data.otp_required && res.data.access) {
        const { access, refresh, user: userData, store_settings: settings, permissions: userPerms } = res.data;
        setToken(access);
        setUser(userData);
        if (settings) {
          setStoreSettings(settings);
          localStorage.setItem('tm_store_settings', JSON.stringify(settings));
        }
        if (userPerms) {
          setPermissions(userPerms);
          localStorage.setItem('tm_permissions', JSON.stringify(userPerms));
        }
        localStorage.setItem('tm_access_token', access);
        if (refresh) localStorage.setItem('tm_refresh_token', refresh);
        localStorage.setItem('tm_user', JSON.stringify(userData));
      }
      return { success: true, data: res.data };
    } catch (err) {
      const msg = extractErrorMessage(err, 'Invalid username or password');
      return { success: false, error: msg };
    }
  };


  const verifyOtp = async (username, otp) => {
    try {
      const res = await authApi.verifyOtp({ username, otp });
      const { access, refresh, user: userData, store_settings: settings, permissions: userPerms } = res.data;
      
      setToken(access);
      setUser(userData);
      setStoreSettings(settings);
      setPermissions(userPerms || null);

      localStorage.setItem('tm_access_token', access);
      localStorage.setItem('tm_refresh_token', refresh);
      localStorage.setItem('tm_user', JSON.stringify(userData));
      localStorage.setItem('tm_store_settings', JSON.stringify(settings));
      if (userPerms) {
        localStorage.setItem('tm_permissions', JSON.stringify(userPerms));
      }

      return { success: true, user: userData };
    } catch (err) {
      const msg = extractErrorMessage(err, 'Invalid OTP code');
      return { success: false, error: msg };
    }
  };

  const login = async (username, password) => {
    try {
      const res = await authApi.login({ username, password });
      const { access, refresh, user: userData, store_settings: settings, permissions: userPerms } = res.data;
      
      setToken(access);
      setUser(userData);
      setStoreSettings(settings);
      setPermissions(userPerms || null);

      localStorage.setItem('tm_access_token', access);
      localStorage.setItem('tm_refresh_token', refresh);
      localStorage.setItem('tm_user', JSON.stringify(userData));
      localStorage.setItem('tm_store_settings', JSON.stringify(settings));
      if (userPerms) {
        localStorage.setItem('tm_permissions', JSON.stringify(userPerms));
      }

      return { success: true, user: userData };
    } catch (err) {
      const msg = extractErrorMessage(err, 'Invalid username or password');
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setPermissions(null);
    localStorage.removeItem('tm_access_token');
    localStorage.removeItem('tm_refresh_token');
    localStorage.removeItem('tm_user');
    localStorage.removeItem('tm_permissions');
    localStorage.removeItem('tm_store_settings');
  };

  const updateStoreSettings = (newSettings, updatedUser) => {
    setStoreSettings(newSettings);
    localStorage.setItem('tm_store_settings', JSON.stringify(newSettings));
    if (updatedUser) {
      setUser(updatedUser);
      localStorage.setItem('tm_user', JSON.stringify(updatedUser));
    }
  };

  // Role permissions checker
  const isRole = (roles) => {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'STORE_OWNER') return true; // Admin/Owner has full access
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const hasPermission = (permKey) => {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'STORE_OWNER') return true;
    return permissions ? !!permissions[permKey] : false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      storeSettings,
      permissions,
      loading,
      login,
      sendOtp,
      verifyOtp,
      logout,
      updateStoreSettings,
      isRole,
      hasPermission,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
