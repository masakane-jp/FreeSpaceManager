import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppUser } from '../types';
import { clearToken, getToken, setToken as storeToken } from './api/client';
import { fetchCurrentUser, login as apiLogin, logout as apiLogout } from './api/resources';

interface AuthContextValue {
  user: AppUser | null;
  isLoading: boolean;
  login: (employeeNumber: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetchCurrentUser()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setIsLoading(false));
  }, []);

  async function login(employeeNumber: string, password?: string) {
    const result = await apiLogin(employeeNumber, password);
    storeToken(result.token);
    setUser(result.user);
  }

  async function logout() {
    try {
      await apiLogout();
    } finally {
      clearToken();
      setUser(null);
    }
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
