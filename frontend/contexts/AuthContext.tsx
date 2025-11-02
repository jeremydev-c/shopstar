'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Use sessionStorage instead of localStorage - each tab gets its own session
  // This allows different users to be logged in different tabs
  const getStorage = () => {
    if (typeof window === 'undefined') return null;
    return sessionStorage; // Each tab has its own sessionStorage
  };

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storage = getStorage();
      if (!storage) return;
      
      const token = storage.getItem('token');
      if (!token) {
        setLoading(false);
        setUser(null);
        return;
      }

      const response = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setUser(response.data.user);
      } else {
        storage.removeItem('token');
        storage.removeItem('userId');
        setUser(null);
      }
    } catch (error) {
      const storage = getStorage();
      if (storage) {
        storage.removeItem('token');
        storage.removeItem('userId');
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      const storage = getStorage();
      if (storage) {
        storage.setItem('token', response.data.token);
        storage.setItem('userId', response.data.user.id);
      }
      setUser(response.data.user);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    if (response.data.success) {
      const storage = getStorage();
      if (storage) {
        storage.setItem('token', response.data.token);
        storage.setItem('userId', response.data.user.id);
      }
      setUser(response.data.user);
    }
  };

  const logout = () => {
    const storage = getStorage();
    if (storage) {
      storage.removeItem('token');
      storage.removeItem('userId');
    }
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

