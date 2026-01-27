import Keycloak from 'keycloak-js';
import { env } from './env';

// Keycloak configuration from environment variables
const keycloakConfig = {
    url: env.VITE_PUBLIC_KEYCLOAK_URL,
    realm: env.VITE_PUBLIC_KEYCLOAK_REALM,
    clientId: env.VITE_PUBLIC_KEYCLOAK_CLIENT_ID,
};

// Initialize Keycloak instance
export const keycloak = new Keycloak(keycloakConfig);

// Override updateToken to prevent refresh when refreshToken is undefined
// This must be done immediately after creating the instance, before any initialization
// Validate that the method exists before overriding (defensive programming)
if (typeof keycloak.updateToken === 'function') {
    const originalUpdateToken = keycloak.updateToken.bind(keycloak);
    keycloak.updateToken = function (minValidity?: number) {
        // Check if refresh token exists before attempting to refresh
        if (!this.refreshToken) {
            console.warn('Cannot refresh token: refresh token is not available');
            // Return a rejected promise to prevent the Keycloak library from making the request
            return Promise.resolve(false);
        }
        return originalUpdateToken(minValidity);
    };
}

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
                // Disable automatic token refresh if no refresh token is available
                checkLoginIframe: false, // Already disabled, but keeping for clarity
            });

            // After init, if authenticated but no refresh token, clear the token
            // This prevents the library from trying to refresh with undefined refresh token
            if (authenticated && !keycloak.refreshToken) {
                console.warn('Authenticated but no refresh token available - clearing session');
                keycloak.clearToken();
                isInitialized = true;
                isInitializing = false;
                return false;
            }

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
 * Login function
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
 * Revoke token with Keycloak
 * This invalidates the token on the server side
 */
export async function revokeToken(): Promise<void> {
    try {
        // Try to revoke refresh token first if available
        if (keycloak.refreshToken) {
            const revokeUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/revoke`;

            const refreshParams = new URLSearchParams();
            refreshParams.append('token', keycloak.refreshToken);
            refreshParams.append('client_id', keycloakConfig.clientId);
            refreshParams.append('token_type_hint', 'refresh_token');

            await fetch(revokeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: refreshParams.toString(),
            });
        }

        // Also revoke access token if available
        if (keycloak.token) {
            const revokeUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/revoke`;

            const accessTokenParams = new URLSearchParams();
            accessTokenParams.append('token', keycloak.token);
            accessTokenParams.append('client_id', keycloakConfig.clientId);
            accessTokenParams.append('token_type_hint', 'access_token');

            await fetch(revokeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: accessTokenParams.toString(),
            });
        }
    } catch (error) {
        console.error('Failed to revoke token:', error);
        // Don't throw - continue with logout even if revocation fails
    }
}

/**
 * Logout function
 */
export async function logout(): Promise<void> {
    try {
        // First revoke the token on the server
        await revokeToken();

        // Then perform logout (this will redirect)
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
 * Get the organization ID from the token
 * This assumes the token has a custom claim 'organization_id' added via Keycloak mapper
 * Uses tokenParsed which is automatically decoded by keycloak-js library
 */
export function getOrganizationId(): string | null {
    if (!keycloak.tokenParsed) {
        return null;
    }

    try {
        // tokenParsed is already decoded by keycloak-js, no need to manually decode
        return (keycloak.tokenParsed as any).organization_id || null;
    } catch (error) {
        console.error('Failed to get organization_id from token:', error);
        return null;
    }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    return keycloak.authenticated || false;
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
                keycloak.logout();
                // Clear interval on logout
                if (tokenRefreshInterval) {
                    clearInterval(tokenRefreshInterval);
                    tokenRefreshInterval = null;
                }
            }
        }
    }, 5 * 60 * 1000); // 5 minutes
}

