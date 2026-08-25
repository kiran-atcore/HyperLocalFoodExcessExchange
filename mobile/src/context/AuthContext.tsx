import React, { createContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { router } from 'expo-router';
import api from '../utils/api';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: string | null;
  isApproved: boolean;
  login: (access: string, refresh: string) => Promise<void>;
  logout: (skipApiCall?: boolean) => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userRole: null,
  isApproved: false,
  login: async () => {},
  logout: async () => {},
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        const decoded: any = jwtDecode(token);
        setUserRole(decoded.role || null);
        setIsApproved(!!decoded.is_approved);
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error('Failed to restore token', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (access: string, refresh: string) => {
    await SecureStore.setItemAsync('access_token', access);
    await SecureStore.setItemAsync('refresh_token', refresh);
    
    const decoded: any = jwtDecode(access);
    setUserRole(decoded.role || null);
    setIsApproved(!!decoded.is_approved);
    setIsAuthenticated(true);
  };

  const logout = async (skipApiCall: boolean = false) => {
    try {
      if (!skipApiCall) {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (refreshToken) {
          await api.post('/users/logout/', { refresh: refreshToken });
        }
      }
    } catch (e) {
      console.error('Logout request failed', e);
    }
    
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    setUserRole(null);
    setIsApproved(false);
    setIsAuthenticated(false);
    router.replace('/(auth)/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, isApproved, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
