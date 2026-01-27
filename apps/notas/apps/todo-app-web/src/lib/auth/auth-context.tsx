import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { AuthContextValue, AuthState } from './types';
import { AnonymousAuthImplementation } from './anonymous-provider';
import { KeycloakAuthImplementation } from './keycloak-provider';

// ============================================================================
// TRACKING TOKEN STORAGE (for analytics, session replay, etc.)
// ============================================================================

class TrackingTokenStorage {
  private readonly KEY = 'todo_app_tracking_token';

  async getToken(): Promise<string | null> {
    return localStorage.getItem(this.KEY);
  }

  async setToken(token: string): Promise<void> {
    localStorage.setItem(this.KEY, token);
  }

  async removeToken(): Promise<void> {
    localStorage.removeItem(this.KEY);
  }
}

const trackingTokenStorage = new TrackingTokenStorage();

// ============================================================================
// AUTH CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// ============================================================================
// AUTH PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    actor: null,
    isAuthenticated: false,
    isAnonymous: false,
    isLoading: true,
    error: null,
  });

  // Use refs to store provider instances so they persist across renders
  const anonymousProviderRef = useRef<AnonymousAuthImplementation | null>(null);
  const keycloakProviderRef = useRef<KeycloakAuthImplementation | null>(null);

  // Initialize providers if not already initialized
  if (!anonymousProviderRef.current) {
    anonymousProviderRef.current = new AnonymousAuthImplementation();
  }
  if (!keycloakProviderRef.current) {
    keycloakProviderRef.current = new KeycloakAuthImplementation();
  }

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeAuth = async () => {
    const anonymousProvider = anonymousProviderRef.current;
    const keycloakProvider = keycloakProviderRef.current;

    if (!anonymousProvider || !keycloakProvider) {
      return;
    }

    try {
      // Initialize tracking token (always needed for analytics/session replay)
      await initializeTrackingToken(anonymousProvider);

      // Initialize Keycloak (checks cookies/SSO)
      await keycloakProvider.initialize();

      // Check if Keycloak authenticated the user
      if (keycloakProvider.isAuthenticated()) {
        const userInfo = keycloakProvider.getUserInfo();

        // Create actor from Keycloak user info
        const actor = {
          actor_type: 'user' as const,
          actor_id: userInfo?.id || '',
          sub: userInfo?.id || '',
          email: userInfo?.email,
          name: userInfo?.name || userInfo?.preferredUsername || 'User',
        };

        setState({
          actor,
          isAuthenticated: true,
          isAnonymous: false,
          isLoading: false,
          error: null,
        });
        return;
      }

      // Not authenticated with Keycloak - local-first mode
      // Create a local anonymous actor for UI purposes (not used for API calls)
      const trackingToken = await trackingTokenStorage.getToken();
      const anonymousActor = trackingToken
        ? createAnonymousActorFromToken(trackingToken)
        : createLocalAnonymousActor();

      setState({
        actor: anonymousActor,
        isAuthenticated: false,
        isAnonymous: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // On error, fall back to local anonymous actor
      setState({
        actor: createLocalAnonymousActor(),
        isAuthenticated: false,
        isAnonymous: true,
        isLoading: false,
        error: 'Failed to initialize authentication',
      });
    }
  };

  const initializeTrackingToken = async (anonymousProvider: AnonymousAuthImplementation) => {
    try {
      let token = await trackingTokenStorage.getToken();

      // Generate new tracking token if doesn't exist
      if (!token) {
        const session = await anonymousProvider.createSession();
        token = session.token;
        await trackingTokenStorage.setToken(token);
      }

      return token;
    } catch (error) {
      console.error('Failed to initialize tracking token:', error);
      throw error;
    }
  };

  const createAnonymousActorFromToken = (token: string) => {
    try {
      // Parse JWT to get actor_id (session_id)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(base64);
      const payload = JSON.parse(json);

      return {
        actor_type: 'anonymous' as const,
        actor_id: payload.sub,
        session_id: payload.sub,
        channel: 'web' as const,
      };
    } catch {
      return createLocalAnonymousActor();
    }
  };

  const createLocalAnonymousActor = () => {
    // Generate a simple UUID for local anonymous actor
    const sessionId = crypto.randomUUID();
    return {
      actor_type: 'anonymous' as const,
      actor_id: sessionId,
      session_id: sessionId,
      channel: 'web' as const,
    };
  };

  const login = useCallback(async () => {
    const keycloakProvider = keycloakProviderRef.current;
    if (!keycloakProvider) {
      return;
    }

    try {
      await keycloakProvider.login();
      // Keycloak will redirect, state will be restored on return
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: 'Login failed. Please try again.',
      }));
    }
  }, []);

  const logout = useCallback(async () => {
    const keycloakProvider = keycloakProviderRef.current;
    if (!keycloakProvider) {
      return;
    }

    try {
      await keycloakProvider.logout();

      // Return to local-first mode
      const trackingToken = await trackingTokenStorage.getToken();
      const anonymousActor = trackingToken
        ? createAnonymousActorFromToken(trackingToken)
        : createLocalAnonymousActor();

      setState({
        actor: anonymousActor,
        isAuthenticated: false,
        isAnonymous: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const refreshActor = useCallback(async () => {
    const keycloakProvider = keycloakProviderRef.current;
    const anonymousProvider = anonymousProviderRef.current;

    if (!keycloakProvider || !anonymousProvider) {
      return;
    }

    try {
      // First check if Keycloak is authenticated
      const keycloakAuthenticated = keycloakProvider.isAuthenticated();
      if (keycloakAuthenticated) {
        const userInfo = keycloakProvider.getUserInfo();

        const actor = {
          actor_type: 'user' as const,
          actor_id: userInfo?.id || '',
          sub: userInfo?.id || '',
          email: userInfo?.email,
          name: userInfo?.name || userInfo?.preferredUsername || 'User',
        };

        setState((prev) => ({
          ...prev,
          actor,
          isAuthenticated: true,
          isAnonymous: false,
        }));
        return;
      }

      // Keycloak not authenticated - ensure tracking token exists and update actor
      await initializeTrackingToken(anonymousProvider);
      const trackingToken = await trackingTokenStorage.getToken();
      const anonymousActor = trackingToken
        ? createAnonymousActorFromToken(trackingToken)
        : createLocalAnonymousActor();

      setState((prev) => ({
        ...prev,
        actor: anonymousActor,
        isAuthenticated: false,
        isAnonymous: true,
      }));
    } catch (error) {
      console.error('Actor refresh failed:', error);
    }
  }, []);

  // Get auth token for API calls (Keycloak token if authenticated, null otherwise)
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    const keycloakProvider = keycloakProviderRef.current;
    if (!keycloakProvider) {
      return null;
    }

    // Always try to get token from Keycloak
    // Keycloak will handle token refresh automatically if needed
    return await keycloakProvider.getToken();
  }, []);

  // Get tracking token for analytics/session replay (always available)
  const getTrackingToken = useCallback(async (): Promise<string | null> => {
    return await trackingTokenStorage.getToken();
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    refreshActor,
    getAuthToken,
    getTrackingToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
