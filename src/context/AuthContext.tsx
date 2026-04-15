import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { mockUser, mockAdmin, mockSuperAdmin } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, organization: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  register: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('forceLogin') === '1') {
      localStorage.removeItem('cybersecurity-user');
      params.delete('forceLogin');
      const qs = params.toString();
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`,
      );
    }

    const savedUser = localStorage.getItem('cybersecurity-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // In a real app, this would call an API
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // For demo purposes, use different mock users based on email
      let selectedUser = mockUser;
      
      if (email.toLowerCase().includes('admin@') || email.toLowerCase() === 'admin') {
        selectedUser = mockAdmin;
      } else if (email.toLowerCase().includes('superadmin@') || email.toLowerCase() === 'superadmin') {
        selectedUser = mockSuperAdmin;
      }
      
      setUser(selectedUser);
      localStorage.setItem('cybersecurity-user', JSON.stringify(selectedUser));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, organization: string) => {
    // In a real app, this would call an API
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Create new user based on mock but with provided details
      const newUser = {
        ...mockUser,
        name,
        email,
        organization
      };
      
      setUser(newUser);
      localStorage.setItem('cybersecurity-user', JSON.stringify(newUser));
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cybersecurity-user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};