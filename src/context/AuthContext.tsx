import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useContentfulBrowserAuth } from '@/hooks/useContentfulBrowserAuth';

interface AuthStatus {
  logged_in: boolean;
  config?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  authUrl: string;
  token: string;
  setToken: (token: string) => void;
  checkAuthStatus: () => Promise<AuthStatus>;
  startLogin: () => Promise<string>;
  saveToken: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setIsLoading: (loading: boolean) => void;
  setAuthUrl: (url: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = React.memo<AuthProviderProps>(({ children }) => {
  const auth = useContentfulBrowserAuth();
  
  const contextValue = useMemo(() => auth, [auth]);
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
});

AuthProvider.displayName = 'AuthProvider';

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}; 