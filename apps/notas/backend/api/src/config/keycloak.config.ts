/**
 * Keycloak Authentication Configuration
 */

import type { MiddlewareHandler } from 'hono';
import { authMiddleware, type AuthMiddlewareOptions, registerAuthRoutes, getAuthRoutesOpenAPI } from '@oxlayer/capabilities-auth';
import { ENV } from './app.config.js';

/**
 * Auth middleware options (exported for route registration)
 */
export const authOptions: AuthMiddlewareOptions = {
  enableKeycloak: ENV.KEYCLOAK_ENABLED,
  keycloak: {
    url: ENV.KEYCLOAK_SERVER_URL,
    realm: ENV.KEYCLOAK_REALM,
    clientId: ENV.KEYCLOAK_CLIENT_ID,
  },
  // Enable JWT fallback for development without Keycloak
  enableJwt: true,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  // Public paths that don't require authentication
  publicPaths: ['/health', '/public', '/docs', '/openapi.json', '/auth', '/api/auth'],
  // Enable token generation routes
  tokenRoutes: {
    enableAnonymous: true,
    enableKeycloak: ENV.KEYCLOAK_ENABLED,
    enableTenant: false, // Single-tenant app
    pathPrefix: '/auth',
    expiresIn: '7d',
  },
};

/**
 * Middleware to extract userId from authPayload and set it in context
 * This runs after authMiddleware to ensure userId is available for controllers
 */
const extractUserIdMiddleware: MiddlewareHandler = async (c, next) => {
  const authPayload = c.get('authPayload');
  if (authPayload) {
    // For JWT tokens, userId is in the 'sub' field
    // For Keycloak tokens, userId might be set by the Keycloak strategy
    const userId = authPayload.sub || authPayload.user_id || authPayload.id;
    if (userId) {
      c.set('userId', String(userId));
    }
  }
  await next();
};

/**
 * Get auth middleware with Keycloak configuration
 * Returns the base auth middleware - userId extraction is handled separately
 */
export function getAuthMiddleware(): MiddlewareHandler {
  return authMiddleware(authOptions);
}

/**
 * Export the extractUserId middleware to be applied after auth middleware
 */
export { extractUserIdMiddleware };
export { registerAuthRoutes, getAuthRoutesOpenAPI }
