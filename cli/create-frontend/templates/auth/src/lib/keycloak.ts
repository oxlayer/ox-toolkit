import Keycloak from 'keycloak-js'

// Keycloak configuration from environment variables
const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://keycloak.localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'myrealm',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'myapp',
}

// Initialize Keycloak instance
export const keycloak = new Keycloak(keycloakConfig)

// Track initialization state
let isInitializing = false
let isInitialized = false
let initPromise: Promise<boolean> | null = null

/**
 * Initialize Keycloak
 */
export async function initKeycloak(): Promise<boolean> {
  if (isInitializing && initPromise) {
    return initPromise
  }

  if (isInitialized) {
    if (!keycloak.token) {
      isInitialized = false
    } else {
      return keycloak.authenticated || false
    }
  }

  isInitializing = true
  initPromise = (async () => {
    try {
      const authenticated = await keycloak.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        enableLogging: true,
        checkLoginIframe: false,
      })

      isInitialized = true
      isInitializing = false
      return authenticated
    } catch (error) {
      isInitializing = false
      if (error instanceof Error && error.message.includes('already been initialized')) {
        isInitialized = true
        return keycloak.authenticated || false
      }
      console.error('Failed to initialize Keycloak:', error)
      return false
    }
  })()

  return initPromise
}

/**
 * Login - redirects to Keycloak login page
 */
export async function login(): Promise<void> {
  try {
    await keycloak.login({
      redirectUri: window.location.origin,
    })
  } catch (error) {
    console.error('Login failed:', error)
    throw error
  }
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  try {
    await keycloak.logout({
      redirectUri: window.location.origin,
    })
  } catch (error) {
    console.error('Logout failed:', error)
    throw error
  }
}

/**
 * Get current access token
 */
export function getToken(): string | undefined {
  return keycloak.token
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return keycloak.authenticated || false
}

/**
 * Wait for Keycloak initialization
 */
export function waitForInit(): Promise<boolean> {
  if (isInitialized) {
    return Promise.resolve(keycloak.authenticated || false)
  }
  if (isInitializing && initPromise) {
    return initPromise
  }
  return initKeycloak()
}

/**
 * Get user info
 */
export function getUserInfo() {
  return keycloak.tokenParsed
}

// Track refresh state
let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

/**
 * Refresh token
 */
export async function refreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  if (!keycloak.refreshToken) {
    console.warn('No refresh token available')
    return false
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const result = await keycloak.updateToken(30)
      return result
    } catch (error) {
      console.error('Failed to refresh token:', error)
      return false
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/**
 * Setup token refresh interval
 */
export function setupTokenRefresh(): void {
  let tokenRefreshInterval: NodeJS.Timeout | null = null

  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval)
  }

  tokenRefreshInterval = setInterval(async () => {
    if (keycloak.authenticated) {
      try {
        if (!keycloak.refreshToken) {
          if (tokenRefreshInterval) {
            clearInterval(tokenRefreshInterval)
            tokenRefreshInterval = null
          }
          return
        }
        await keycloak.updateToken(30)
      } catch (error) {
        console.error('Token refresh failed:', error)
        keycloak.login()
        if (tokenRefreshInterval) {
          clearInterval(tokenRefreshInterval)
          tokenRefreshInterval = null
        }
      }
    }
  }, 5 * 60 * 1000)
}
