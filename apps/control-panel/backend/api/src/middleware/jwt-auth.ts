/**
 * JWT Auth Middleware
 *
 * Authenticates requests using Bearer tokens (JWT) issued by device auth flow.
 * This is the primary authentication method for CLI requests.
 */

import { HttpError } from '@oxlayer/foundation-http-kit';
import jwt from 'jsonwebtoken';
import type { DeviceSession } from '../domain/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export interface JwtPayload {
  deviceId: string;
  organizationId: string;
  scopes: string[];
  iat: number;
  exp: number;
}

export interface AuthContext {
  deviceId: string;
  organizationId: string;
  scopes: string[];
}

/**
 * Extract and verify JWT from Authorization header
 */
export function extractJwt(request: Request): JwtPayload {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    throw new HttpError(401, 'Missing Authorization header');
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new HttpError(
      401,
      'Invalid Authorization header format. Expected: Bearer <token>'
    );
  }

  const token = authHeader.substring(7);

  if (!token) {
    throw new HttpError(401, 'Missing token');
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return payload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new HttpError(401, 'Token expired. Please run: oxlayer login');
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new HttpError(401, 'Invalid token');
    }
    throw new HttpError(401, 'Authentication failed');
  }
}

/**
 * Check if authenticated context has required scope
 */
export function hasScope(
  auth: AuthContext,
  requiredScope: string
): boolean {
  return auth.scopes.includes(requiredScope);
}

/**
 * Require specific scope or throw error
 */
export function requireScope(
  auth: AuthContext,
  requiredScope: string
): void {
  if (!hasScope(auth, requiredScope)) {
    throw new HttpError(
      403,
      `Insufficient permissions. Required scope: ${requiredScope}`
    );
  }
}

/**
 * JWT Auth Middleware Class
 *
 * Can be used as a guard in controllers.
 */
export class JwtAuthMiddleware {
  /**
   * Authenticate request and return auth context
   */
  authenticate(request: Request): AuthContext {
    const payload = extractJwt(request);

    return {
      deviceId: payload.deviceId,
      organizationId: payload.organizationId,
      scopes: payload.scopes,
    };
  }

  /**
   * Authenticate with required scope
   */
  authenticateWithScope(
    request: Request,
    requiredScope: string
  ): AuthContext {
    const auth = this.authenticate(request);
    requireScope(auth, requiredScope);
    return auth;
  }
}
