'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '../../services/api';
import { ApiResponse, User } from '../../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
  hasRole: (roleName: string) => boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('pmp_access_token');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const res = await api.get<ApiResponse<User>>('/auth/me');
      setUser(res.data.data);
      localStorage.setItem('pmp_user', JSON.stringify(res.data.data));
    } catch {
      setUser(null);
      localStorage.removeItem('pmp_access_token');
      localStorage.removeItem('pmp_refresh_token');
      localStorage.removeItem('pmp_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial check from storage
    const cached = localStorage.getItem('pmp_user');
    if (cached) {
      try {
        setUser(JSON.parse(cached));
      } catch {
        // ignore
      }
    }
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post<ApiResponse<{ accessToken: string; refreshToken: string; user: User }>>(
        '/auth/login',
        { email, password },
      );

      const { accessToken, refreshToken, user: authUser } = res.data.data;
      localStorage.setItem('pmp_access_token', accessToken);
      localStorage.setItem('pmp_refresh_token', refreshToken);
      localStorage.setItem('pmp_user', JSON.stringify(authUser));

      setUser(authUser);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('pmp_refresh_token');
      await api.post('/auth/logout', { refreshToken }).catch(() => {});
    } finally {
      localStorage.removeItem('pmp_access_token');
      localStorage.removeItem('pmp_refresh_token');
      localStorage.removeItem('pmp_user');
      setUser(null);
      router.push('/login');
    }
  };

  const hasRole = useCallback(
    (roleName: string): boolean => {
      if (!user || !user.roles) return false;
      return user.roles.some((r) => r.name === roleName);
    },
    [user],
  );

  const isSuperAdmin = user ? (user.roles?.some((r) => r.name === 'SUPER_ADMIN') || false) : false;
  const isAdmin = user ? (user.roles?.some((r) => r.name === 'ADMIN' || r.name === 'SUPER_ADMIN') || false) : false;

  const hasPermission = useCallback(
    (permissionCode: string): boolean => {
      if (!user) return false;
      if (isSuperAdmin) return true;
      if (!user.permissions) return false;
      if (user.permissions.includes('*')) return true;
      return user.permissions.includes(permissionCode);
    },
    [user, isSuperAdmin],
  );

  // Route protection effect
  useEffect(() => {
    if (!isLoading) {
      const isAuthRoute = pathname === '/login';
      if (!user && !isAuthRoute) {
        router.push('/login');
      } else if (user && isAuthRoute) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshProfile,
        hasPermission,
        hasRole,
        isSuperAdmin,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
