import React, { createContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { router } from 'expo-router';
import api from '../utils/api';
import { clearSharedLocation } from '../utils/sharedState';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: string | null;
  userEmail: string | null;
  isApproved: boolean;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BANNED';
  rejectionCount: number;
  rejectionReason: string | null;
  login: (access: string, refresh: string) => Promise<void>;
  logout: (skipApiCall?: boolean) => Promise<void>;
  updateApprovalState: (status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BANNED') => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userRole: null,
  userEmail: null,
  isApproved: false,
  approvalStatus: 'PENDING',
  rejectionCount: 0,
  rejectionReason: null,
  login: async () => {},
  logout: async () => {},
  updateApprovalState: () => {},
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [approvalStatus, setApprovalStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'BANNED'>('PENDING');
  const [rejectionCount, setRejectionCount] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
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
        setUserEmail(decoded.email || null);
        setIsApproved(!!decoded.is_approved);
        setApprovalStatus(decoded.approval_status || 'PENDING');
        setRejectionCount(decoded.rejection_count || 0);
        setRejectionReason(decoded.rejection_reason || null);
        setIsAuthenticated(true);

        // Fetch latest profile to ensure approval status is up to date with the database
        try {
          const response = await api.get('/users/me/');
          const user = response.data;
          setIsApproved(!!user.is_approved);
          setApprovalStatus(user.approval_status || 'PENDING');
          setRejectionCount(user.rejection_count || 0);
          setRejectionReason(user.rejection_reason || null);
        } catch (apiErr) {
          // Ignore API error (e.g. offline), fallback to token claims
        }
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
    setUserEmail(decoded.email || null);
    setIsApproved(!!decoded.is_approved);
    setApprovalStatus(decoded.approval_status || 'PENDING');
    setRejectionCount(decoded.rejection_count || 0);
    setRejectionReason(decoded.rejection_reason || null);
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
    clearSharedLocation();
    setUserRole(null);
    setUserEmail(null);
    setIsApproved(false);
    setApprovalStatus('PENDING');
    setRejectionCount(0);
    setRejectionReason(null);
    setIsAuthenticated(false);
    
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace('/(auth)/login');
  };

  const updateApprovalState = (status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BANNED') => {
    setApprovalStatus(status);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, userEmail, isApproved, approvalStatus, rejectionCount, rejectionReason, login, logout, updateApprovalState, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
