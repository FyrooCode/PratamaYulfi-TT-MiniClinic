import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/api/auth.api';
import { setAccessToken } from '@/api/axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Non-sensitive cached user info to prevent layout flash on refresh
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  // Silent Refresh on Mount / Page Reload
  const initializeAuth = useCallback(async () => {
    try {
      // Backend verifies the HttpOnly refreshToken cookie automatically
      const res = await authApi.refresh();
      if (res.success && res.data) {
        const token = res.data.accessToken || res.data.token;
        const userData = res.data.user;

        setAccessToken(token);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      // If refresh fails (cookie expired or absent), invalidate in-memory and local cache
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    if (res.success && res.data) {
      const { user: userData, accessToken, token } = res.data;
      const activeToken = accessToken || token;

      // Pure in-memory storage for Access Token
      setAccessToken(activeToken);

      // Non-sensitive user profile cache
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      return userData;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore network failure on logout
    } finally {
      // Clear in-memory token and cached user
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem('user');
      // Clean up legacy keys if they still exist
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
