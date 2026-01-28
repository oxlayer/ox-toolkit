/**
 * Auth Context Provider
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { initKeycloak, logout as keycloakLogout, isAuthenticated, getUserInfo } from './keycloak';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: ReturnType<typeof getUserInfo> | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<ReturnType<typeof getUserInfo> | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const authenticated = await initKeycloak();
        setIsAuthenticated(authenticated);
        if (authenticated) {
          setUser(getUserInfo());
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  async function logout() {
    await keycloakLogout();
    setIsAuthenticated(false);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
