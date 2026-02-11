'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  username: string;
  email?: string;
  nama_lengkap?: string;
  sektor?: string;
  angkatan?: string;
  santri_id?: number;
}

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isPengurus: boolean;
  isSantri: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('authLoading');
      return stored ? JSON.parse(stored) : true;
    }
    return true;
  });

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      const storedUser = localStorage.getItem('user');
      const storedRole = localStorage.getItem('role');
      if (storedUser && storedRole) {
        setUser(JSON.parse(storedUser));
        setRole(storedRole);
      }
    }
    setLoading(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('authLoading', JSON.stringify(false));
    }
  }, []);

  const login = async (username: string, password: string) => {
    const response = await api.login(username, password);
    
    api.setToken(response.token);
    setUser(response.user);
    setRole(response.role);
    
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('role', response.role);
    localStorage.setItem('authLoading', JSON.stringify(false));
    
    return response;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setUser(null);
    setRole(null);
    api.removeToken();
    if (typeof window !== 'undefined') {
      localStorage.setItem('authLoading', JSON.stringify(true));
    }
  };

  const value = {
    user,
    role,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isPengurus: role === 'pengurus',
    isSantri: role === 'santri',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
