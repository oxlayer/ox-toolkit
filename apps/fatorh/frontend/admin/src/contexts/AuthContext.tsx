/**
 * Keycloak Authentication Context
 *
 * Provides authentication state and methods for the FatorH Admin app.
 * Uses realm-platform for admin users (platform-admin role required).
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Keycloak from 'keycloak-js';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userInfo: UserInfo | null;
  token: string | null;
  login: () => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Keycloak configuration
const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'realm-platform',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'example-admin',
};

// Initialize Keycloak instance
const keycloak = new Keycloak(keycloakConfig);

// Module-level initialization state (persists across page reloads)
let isInitializing = false;
let isInitialized = false;
let initPromise: Promise<boolean> | null = null;

/**
 * Initialize Keycloak and return a promise that resolves when authentication is complete
 */
async function initKeycloak(): Promise<boolean> {
  // If currently initializing, return the existing promise
  if (isInitializing && initPromise) {
    return initPromise;
  }

  // If already initialized and has token, return current state
  if (isInitialized) {
    if (!keycloak.token) {
      // No token means user logged out, allow re-initialization
      isInitialized = false;
    } else {
      return keycloak.authenticated || false;
    }
  }

  // Start initialization
  isInitializing = true;
  initPromise = (async () => {
    try {
      const authenticated = await keycloak.init({
        onLoad: 'login-required',
        pkceMethod: 'S256',
        checkLoginIframe: false,
        silentCheckSsoFallback: false,
      });

      isInitialized = true;
      isInitializing = false;
      return authenticated;
    } catch (error) {
      isInitializing = false;
      if (error instanceof Error && error.message.includes('already been initialized')) {
        isInitialized = true;
        return keycloak.authenticated || false;
      }
      console.error('Failed to initialize Keycloak:', error);
      return false;
    }
  })();

  return initPromise;
}

// Helper to parse JWT
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Extract user info from Keycloak token
function extractUserInfo(): UserInfo | null {
  const token = keycloak.token;
  if (!token) return null;

  const parsedToken = parseJwt(token);
  const roles = parsedToken?.realm_access?.roles || [];
  const resourceRoles = parsedToken?.resource_access || {};

  // Combine realm and resource roles
  const allRoles = [
    ...roles,
    ...Object.values(resourceRoles).flatMap((r: any) => r?.roles || []),
  ];

  return {
    id: keycloak.subject || '',
    email: parsedToken?.email || '',
    name: parsedToken?.given_name && parsedToken?.family_name
      ? `${parsedToken.given_name} ${parsedToken.family_name}`
      : parsedToken?.preferred_username || parsedToken?.name || '',
    roles: allRoles,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let refreshInterval: NodeJS.Timeout | undefined;

    const initializeAuth = async () => {
      try {
        const authenticated = await initKeycloak();
        const currentToken = keycloak.token;

        // If no token, not authenticated
        const isReallyAuthenticated = authenticated && !!currentToken;

        if (!mounted) return;

        setIsAuthenticated(isReallyAuthenticated);

        if (isReallyAuthenticated) {
          const userInfo_ = extractUserInfo();
          setUserInfo(userInfo_);
          setToken(currentToken || null);
          localStorage.setItem('kc_token', currentToken || '');

          // Check if user has platform-admin role
          if (userInfo_ && !userInfo_.roles.includes('platform-admin')) {
            console.warn('User does not have platform-admin role');
          }

          // Set up token refresh
          refreshInterval = setInterval(() => {
            if (mounted && keycloak.authenticated) {
              keycloak.updateToken(60).then((refreshed) => {
                if (refreshed && mounted) {
                  const newToken = keycloak.token;
                  setToken(newToken || null);
                  localStorage.setItem('kc_token', newToken || '');
                }
              });
            }
          }, 60000);
        } else {
          setUserInfo(null);
          setToken(null);
          localStorage.removeItem('kc_token');
        }
      } catch (error) {
        console.error('Failed to initialize authentication:', error);
        if (mounted) {
          setIsAuthenticated(false);
          setUserInfo(null);
          setToken(null);
          localStorage.removeItem('kc_token');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up Keycloak event listeners
    const onAuthSuccess = () => {
      if (mounted) {
        setIsAuthenticated(true);
        const userInfo_ = extractUserInfo();
        setUserInfo(userInfo_);
        setToken(keycloak.token || null);
        localStorage.setItem('kc_token', keycloak.token || '');
      }
    };

    const onAuthLogout = () => {
      if (mounted) {
        setIsAuthenticated(false);
        setUserInfo(null);
        setToken(null);
        localStorage.removeItem('kc_token');
      }
    };

    const onTokenExpired = () => {
      if (mounted) {
        setIsAuthenticated(false);
        setUserInfo(null);
        setToken(null);
        localStorage.removeItem('kc_token');
      }
    };

    // Store original callbacks
    const originalOnAuthSuccess = keycloak.onAuthSuccess;
    const originalOnAuthLogout = keycloak.onAuthLogout;
    const originalOnTokenExpired = keycloak.onTokenExpired;

    keycloak.onAuthSuccess = onAuthSuccess;
    keycloak.onAuthLogout = onAuthLogout;
    keycloak.onTokenExpired = onTokenExpired;

    return () => {
      mounted = false;
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      // Restore original callbacks
      keycloak.onAuthSuccess = originalOnAuthSuccess;
      keycloak.onAuthLogout = originalOnAuthLogout;
      keycloak.onTokenExpired = originalOnTokenExpired;
    };
  }, []);

  const login = () => {
    keycloak.login({
      redirectUri: window.location.origin,
    });
  };

  const logout = () => {
    localStorage.removeItem('kc_token');
    keycloak.logout({
      redirectUri: window.location.origin,
    });
  };

  const hasRole = (role: string) => {
    return userInfo?.roles.includes(role) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        userInfo,
        token,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
