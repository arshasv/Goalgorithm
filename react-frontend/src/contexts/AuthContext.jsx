import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../api/authService';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const decoded = jwtDecode(token);
          // Check expiration
          if (decoded.exp * 1000 < Date.now()) {
            logout();
          } else {
            const userData = await AuthService.getMe();
            setUser(userData);
          }
        } catch (error) {
          console.error('Invalid token or failed to fetch user', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();

    const handleAuthError = () => logout();
    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, [token]);

  const login = async (credentials) => {
    const data = await AuthService.login(credentials);
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    const userData = await AuthService.getMe();
    setUser(userData);
  };

  const register = async (data) => {
    await AuthService.register(data);
    // After registration, login is typically required or done automatically.
    // For this flow, we will return the response and let the UI handle it.
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isOrganizer: user?.role === 'ORGANIZER',
    isTeamLeader: user?.role === 'TEAM_LEADER',
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
