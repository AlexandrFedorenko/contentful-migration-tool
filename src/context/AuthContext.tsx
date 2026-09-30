import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useSession } from '@/context/SessionContext';

interface AuthContextType {
  /** True when the signed-in user has an active Contentful connection. */
  isLoggedIn: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoaded } = useSession();
  const value = useMemo(
    () => ({ isLoggedIn: Boolean(user?.hasContentfulToken), isLoading: !isLoaded }),
    [user?.hasContentfulToken, isLoaded]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
