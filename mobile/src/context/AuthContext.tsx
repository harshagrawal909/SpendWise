import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { clearAuthToken, decodeJwtEmail, getAuthToken, setAuthToken } from '@/utils/authToken';
import { clearCache } from '@/services/transactionService';

type AuthContextValue = {
  token: string | null;
  email: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAuthToken()
      .then((stored) => setToken(stored))
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = useCallback(async (nextToken: string) => {
    await setAuthToken(nextToken);
    setToken(nextToken);
  }, []);

  const signOut = useCallback(async () => {
    await clearAuthToken();
    await clearCache();
    setToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      email: token ? decodeJwtEmail(token) : '',
      isLoading,
      isAuthenticated: Boolean(token),
      signIn,
      signOut,
    }),
    [token, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
