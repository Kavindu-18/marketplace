'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { api, persistTokens, clearStoredTokens, loadRefreshToken } from '@/lib/api';
import type { MeResponse } from '@marketplace/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface AuthContextValue {
  user: MeResponse | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    role: 'CUSTOMER' | 'PROVIDER',
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rt = loadRefreshToken();
    if (!rt) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(({ accessToken, refreshToken }) => {
        persistTokens(accessToken, refreshToken);
        return api.get<MeResponse>('/auth/me');
      })
      .then((me) => setUser(me))
      .catch(() => clearStoredTokens())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken, refreshToken } = await api.post<{
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', { email, password });
    persistTokens(accessToken, refreshToken);
    const me = await api.get<MeResponse>('/auth/me');
    setUser(me);
  }, []);

  const register = useCallback(
    async (email: string, password: string, role: 'CUSTOMER' | 'PROVIDER') => {
      const { accessToken, refreshToken } = await api.post<{
        accessToken: string;
        refreshToken: string;
      }>('/auth/register', { email, password, role });
      persistTokens(accessToken, refreshToken);
      const me = await api.get<MeResponse>('/auth/me');
      setUser(me);
    },
    [],
  );

  const logout = useCallback(() => {
    clearStoredTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
