/**
 * Keycloak Authentication Configuration
 */

import {
  authMiddleware,
  registerAuthRoutes,
  getAuthRoutesOpenAPI,
  type AuthMiddlewareOptions,
} from '@oxlayer/capabilities-auth';
import { generateToken, verifyToken } from '@oxlayer/capabilities-auth';
import { ENV } from './app.config.js';

/**
 * Auth middleware options
 */
export const authOptions: AuthMiddlewareOptions = {
  enableKeycloak: ENV.KEYCLOAK_ENABLED === 'true',
  keycloak: ENV.KEYCLOAK_ENABLED === 'true' ? {
    url: ENV.KEYCLOAK_SERVER_URL,
    realm: ENV.KEYCLOAK_REALM,
    clientId: ENV.KEYCLOAK_CLIENT_ID,
  } : undefined,
  enableJwt: true,
  jwtSecret: ENV.JWT_SECRET,
  publicPaths: ['/health', '/docs', '/openapi.json', '/metrics'],
  tokenRoutes: {
    enableAnonymous: true,
    enableKeycloak: ENV.KEYCLOAK_ENABLED === 'true',
    pathPrefix: '/api/auth',
    expiresIn: '7d',
  },
};

/**
 * Get auth middleware
 */
export const getAuthMiddleware = () => authMiddleware(authOptions);

/**
 * Get token generation for anonymous users
 */
export const generateAnonymousToken = () => {
  return generateToken(
    { userId: 'anonymous', role: 'anonymous' },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Verify JWT token
 */
export const verifyJwtToken = (token: string) => {
  return verifyToken(token, ENV.JWT_SECRET);
};

/**
 * Extract user ID from request context
 */
export const extractUserIdMiddleware = async (c: any, next: any) => {
  const authPayload = c.get('authPayload');
  if (authPayload?.userId) {
    c.set('userId', authPayload.userId);
  }
  await next();
};

/**
 * Re-export auth functions for convenience
 */
export { registerAuthRoutes, getAuthRoutesOpenAPI };
export type { AuthMiddlewareOptions };
