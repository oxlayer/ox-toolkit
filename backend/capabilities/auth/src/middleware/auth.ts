import type { Context, Next } from 'hono';
import { keycloakStrategy, jwtStrategy } from '../strategies/index.js';
import type { AuthMiddlewareOptions } from '../types.js';

/**
 * Unified authentication middleware
 * Attempts Keycloak authentication first (if enabled), then falls back to JWT (if enabled)
 */
export function authMiddleware(options: AuthMiddlewareOptions = {}) {
  const {
    enableKeycloak = false,
    keycloak,
    enableJwt = true,
    jwtSecret = process.env.JWT_SECRET || '',
    publicPaths = ['/health', '/docs', '/openapi.json', '/reference'],
    _adminOnlyRoutes = ['/organizations', '/users', '/keycloak'],
    enableTenancy = false,
  } = options;

  if (enableJwt && !jwtSecret) {
    throw new Error('JWT secret is required when JWT authentication is enabled');
  }

  return async (c: Context, next: Next) => {
    const path = c.req.path;

    // Skip authentication for public paths
    if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
      c.set('authStrategy', 'none');
      c.set('isAuthenticated', false);
      return next();
    }

    let result;

    // Try Keycloak first if enabled
    if (enableKeycloak && keycloak) {
      result = await keycloakStrategy(c, { ...keycloak, enableTenancy });
      if (result.valid) {
        c.set('authStrategy', 'keycloak');
        c.set('authPayload', result.payload!);
        c.set('isAuthenticated', true);
        // Set userId from payload
        const payload = result.payload as any;
        if (payload.sub || payload.id) {
          c.set('userId', String(payload.sub || payload.id));
        }
        return next();
      }
    }

    // Fall back to JWT if enabled
    if (enableJwt) {
      result = await jwtStrategy(c, { secret: jwtSecret });
      if (result.valid) {
        c.set('authStrategy', 'jwt');
        c.set('authPayload', result.payload!);
        c.set('isAuthenticated', true);
        // Set userId from payload
        const payload = result.payload as any;
        if (payload.sub || payload.id) {
          c.set('userId', String(payload.sub || payload.id));
        }
        return next();
      }
    }

    // If we get here, authentication failed
    return c.json(
      {
        error: 'Unauthorized',
        message: result?.error || 'Authentication failed',
      },
      401
    );
  };
}

/**
 * Middleware that requires authentication
 * Returns 401 if the request is not authenticated
 */
export function requireAuth() {
  return async (c: Context, next: Next) => {
    const isAuthenticated = c.get('isAuthenticated');

    if (!isAuthenticated) {
      return c.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required',
        },
        401
      );
    }

    return next();
  };
}

/**
 * Middleware that requires a specific authentication strategy
 */
export function requireStrategy(strategy: 'keycloak' | 'jwt') {
  return async (c: Context, next: Next) => {
    const authStrategy = c.get('authStrategy');

    if (authStrategy !== strategy) {
      return c.json(
        {
          error: 'Unauthorized',
          message: `${strategy} authentication required`,
        },
        401
      );
    }

    return next();
  };
}

/**
 * Helper to get authenticated user from context
 */
export function getAuthPayload(c: Context) {
  return c.get('authPayload');
}

/**
 * Helper to check if the request is authenticated
 */
export function isAuthenticated(c: Context): boolean {
  return c.get('isAuthenticated') === true;
}

/**
 * Helper to get the authentication strategy used
 */
export function getAuthStrategy(c: Context): 'keycloak' | 'jwt' | 'none' {
  return c.get('authStrategy') || 'none';
}
