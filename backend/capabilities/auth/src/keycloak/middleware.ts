import type { Context, Next } from 'hono';
import { KeycloakService } from './service.js';
import type { KeycloakAuthenticatedUser, KeycloakConfig } from './types.js';

export interface KeycloakMiddlewareOptions {
  publicPaths?: string[];
  adminOnlyRoutes?: string[];
  config?: KeycloakConfig;
}

/**
 * Keycloak authentication middleware for Hono
 * Validates JWT tokens from Keycloak and extracts organization_id
 */
export function keycloakMiddleware(options: KeycloakMiddlewareOptions = {}) {
  const {
    publicPaths = ['/health', '/auth/login', '/auth/callback', '/reference', '/openapi.json', '/docs'],
    adminOnlyRoutes: _adminOnlyRoutes = ['/organizations', '/users', '/keycloak'],
    config,
  } = options;

  const keycloakService = config ? new KeycloakService(config) : new KeycloakService();

  return async (c: Context, next: Next) => {
    const path = c.req.path;
    const _method = c.req.method;

    // Skip authentication for public paths
    if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
      return next();
    }

    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
      return c.json({
        error: 'Unauthorized',
        message: 'Authorization header is required',
      }, 401);
    }

    // Validate token
    const validation = await keycloakService.validateToken(authHeader);

    if (!validation.valid || !validation.payload) {
      return c.json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        details: validation.error,
      }, 401);
    }

    const payload = validation.payload;

    // Extract user roles from token
    const userRoles = (payload.realm_access as any)?.roles || [];
    const isAdmin = userRoles.includes('admin');

    // Identify user type based on Keycloak client (azp)
    const userType = await keycloakService.getUserTypeFromToken(authHeader);

    // Extract organization_id from token
    const organizationId = await keycloakService.getOrganizationIdFromToken(authHeader);

    // Set organization_id in context if present (no longer required)
    if (organizationId) {
      c.set('organizationId', organizationId);
    }

    // Add auth info to context
    c.set('authType', 'keycloak');
    c.set('userId', payload.sub as string);
    c.set('userEmail', (payload.email || payload.preferred_username) as string);
    c.set('userRoles', userRoles);
    c.set('userType', userType);
    c.set('keycloakPayload', payload);

    // Set user info in the standard format for compatibility
    const keycloakUser: KeycloakAuthenticatedUser = {
      user_id: payload.sub as string,
      user_email: (payload.email || payload.preferred_username) as string,
      organization_id: organizationId,
      roles: userRoles,
      is_admin: isAdmin,
    };
    c.set('keycloakUser', keycloakUser);

    return next();
  };
}

/**
 * Helper to get organization_id from context
 */
export function getOrganizationId(c: Context): string | null {
  return c.get('organizationId') || null;
}

/**
 * Helper to check if user has specific role
 */
export function hasRole(c: Context, role: string): boolean {
  const roles = c.get('userRoles') || [];
  return roles.includes(role);
}

/**
 * Helper to check if user is admin
 */
export function isAdmin(c: Context): boolean {
  return hasRole(c, 'admin');
}

/**
 * Helper to get authenticated user from context
 */
export function getKeycloakUser(c: Context): KeycloakAuthenticatedUser | undefined {
  return c.get('keycloakUser');
}
