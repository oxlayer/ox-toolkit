import Keycloak from 'keycloak-js';

// Keycloak configuration from environment variables
const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'alo',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'alo-manager-web',
};

// Initialize Keycloak instance
export const keycloak = new Keycloak(keycloakConfig);

// Track initialization state to prevent multiple initializations
let isInitializing = false;
let isInitialized = false;
let initPromise: Promise<boolean> | null = null;

/**
 * Initialize Keycloak and return a promise that resolves when authentication is complete
 * Prevents multiple initializations (e.g., from React StrictMode)
 */
export async function initKeycloak(): Promise<boolean> {
  // If currently initializing, return the existing promise
  if (isInitializing && initPromise) {
    return initPromise;
  }

  // If already initialized, check current state
  if (isInitialized) {
    // If no token, user is logged out - allow re-initialization
    if (!keycloak.token) {
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
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        enableLogging: true,
        checkLoginIframe: false,
      });

      isInitialized = true;
      isInitializing = false;
      return authenticated;
    } catch (error) {
      isInitializing = false;
      // If error is about already being initialized, mark as initialized
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

/**
 * Login function - redirects to Keycloak login page
 */
export async function login(): Promise<void> {
  try {
    await keycloak.login({
      redirectUri: window.location.origin,
    });
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

/**
 * Logout function
 */
export async function logout(): Promise<void> {
  try {
    await keycloak.logout({
      redirectUri: window.location.origin,
    });
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
}

/**
 * Get the current access token
 */
export function getToken(): string | undefined {
  return keycloak.token;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return keycloak.authenticated || false;
}

/**
 * Wait for Keycloak to be initialized before proceeding
 * Returns the init promise if initializing, or resolves immediately if already initialized
 */
export function waitForInit(): Promise<boolean> {
  if (isInitialized) {
    return Promise.resolve(keycloak.authenticated || false);
  }
  if (isInitializing && initPromise) {
    return initPromise;
  }
  // If neither initialized nor initializing, start initialization
  return initKeycloak();
}

/**
 * Get user info
 */
export function getUserInfo() {
  return keycloak.tokenParsed;
}

// Track refresh state to prevent race conditions
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Refresh token with lock to prevent race conditions
 * Multiple simultaneous requests will share the same refresh promise
 */
export async function refreshToken(): Promise<boolean> {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  // Check if refresh token exists
  if (!keycloak.refreshToken) {
    console.warn('No refresh token available, user needs to login again');
    return false;
  }

  // Set refreshing flag and create promise
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const result = await keycloak.updateToken(30);
      return result;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Track token refresh interval to prevent multiple intervals
let tokenRefreshInterval: NodeJS.Timeout | null = null;

/**
 * Set up token refresh interval
 * Prevents multiple intervals from being created
 */
export function setupTokenRefresh(): void {
  // Clear existing interval if any
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
  }

  // Refresh token every 5 minutes
  tokenRefreshInterval = setInterval(async () => {
    if (keycloak.authenticated) {
      try {
        // Check if refresh token exists before trying to refresh
        if (!keycloak.refreshToken) {
          console.warn('No refresh token available, clearing interval');
          if (tokenRefreshInterval) {
            clearInterval(tokenRefreshInterval);
            tokenRefreshInterval = null;
          }
          return;
        }
        await keycloak.updateToken(30);
      } catch (error) {
        console.error('Token refresh failed:', error);
        // If refresh fails, user needs to login again
        keycloak.login();
        // Clear interval on logout
        if (tokenRefreshInterval) {
          clearInterval(tokenRefreshInterval);
          tokenRefreshInterval = null;
        }
      }
    }
  }, 5 * 60 * 1000); // 5 minutes
}

/**
 * Get the current Keycloak realm
 */
export function getRealm(): string {
  return keycloakConfig.realm;
}
