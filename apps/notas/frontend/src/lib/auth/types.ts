import type { Actor, AnonymousActor } from '@/types';

// Re-export for use in auth modules
export type { AnonymousActor };

// ============================================================================
// AUTH CONTEXT TYPES
// ============================================================================

export interface AuthState {
  actor: Actor | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshActor: () => Promise<void>;
  // Get auth token for API calls (Keycloak token if authenticated, null otherwise)
  getAuthToken: () => Promise<string | null>;
  // Get tracking token for analytics/session replay (always available)
  getTrackingToken: () => Promise<string | null>;
}

// ============================================================================
// JWT TYPES
// ============================================================================

export interface JwtPayload {
  sub: string;               // JWT subject (user ID)
  name: string;
  email: string;
  exp?: number;
  iat?: number;
  // Optional fields for Keycloak
  organization_id?: string;
  tenant_id?: string;
  tenant_name?: string;
}

// ============================================================================
// TOKEN STORAGE TYPES
// ============================================================================

export interface TokenStorage {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  removeToken(): Promise<void>;
}

export class LocalStorageTokenStorage implements TokenStorage {
  private readonly KEY = 'todo_app_token';

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

// ============================================================================
// TRACKING TOKEN STORAGE (for analytics, session replay, etc.)
// ============================================================================

export class TrackingTokenStorage {
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

// ============================================================================
// AUTH PROVIDER TYPES
// ============================================================================

export interface AnonymousAuthProvider {
  type: 'anonymous';
  createSession(): Promise<{ token: string; actor: AnonymousActor }>;
  refreshSession(): Promise<{ token: string; actor: AnonymousActor }>;
}

export interface UserAuthProvider {
  type: 'keycloak';
  login(): Promise<void>;
  logout(): Promise<void>;
  getToken(): Promise<string | null>;
  refreshToken(): Promise<string>;
}

// ============================================================================
// PARSED ACTOR FROM JWT
// ============================================================================

export function parseActorFromJwt(token: string): Actor | null {
  try {
    const payload = parseJwt(token) as JwtPayload;

    // Check if email contains "@anonymous.local" - this indicates anonymous user
    const isAnonymous = payload.email?.includes('@anonymous.local');

    if (isAnonymous) {
      return {
        actor_type: 'anonymous',
        actor_id: payload.sub,
        session_id: payload.sub,
        channel: (payload as any).channel || 'web',
      };
    }

    // Otherwise, it's a regular user (from Keycloak or JWT)
    return {
      actor_type: 'user',
      actor_id: payload.sub,
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

function parseJwt(token: string): JwtPayload {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const json = atob(base64);
  return JSON.parse(json);
}
