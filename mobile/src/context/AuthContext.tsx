import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { clearAuthToken, decodeJwt, getAuthToken, setAuthToken } from '@/utils/authToken';
import { clearCache } from '@/services/transactionService';

type AuthContextValue = {
  token: string | null;
  email: string;
  role: string;
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
    console.log("AuthContext started");
    getAuthToken()
      .then((stored) => {
        console.log("Stored token:", stored);
        setToken(stored);
      })
      .catch((err) => {
        console.log("Auth error:", err);
      })
      .finally(() => {
        console.log("Loading finished");
        setIsLoading(false);
      });
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
    () => {
      const payload = token ? decodeJwt(token) : null;
      return {
        token,
        email: payload?.email ?? '',
        role: payload?.role ?? 'user',
        isLoading,
        isAuthenticated: Boolean(token),
        signIn,
        signOut,
      };
    },
    [token, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
