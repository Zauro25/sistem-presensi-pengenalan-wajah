'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
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
  }, []);

  const login = async (username, password) => {
    const response = await api.login(username, password);
    
    api.setToken(response.token);
    setUser(response.user);
    setRole(response.role);
    
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('role', response.role);
    
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
