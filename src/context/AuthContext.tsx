import React, { createContext, useContext, ReactNode } from 'react';
import { useContentfulBrowserAuth } from '@/hooks/useContentfulBrowserAuth';

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  authUrl: string;
  token: string;
  setToken: (token: string) => void;
  checkAuthStatus: () => Promise<any>;
  startLogin: () => Promise<any>;
  saveToken: (token: string) => Promise<any>;
  logout: () => Promise<void>;
  setIsLoading: (loading: boolean) => void;
  setAuthUrl: (url: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useContentfulBrowserAuth();
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}; 