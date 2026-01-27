import jwt from 'jsonwebtoken';
import type { Context } from 'hono';
import type { AuthResult } from '../types.js';

export interface JWTPayload {
  sub: string;  // JWT standard subject field - user identifier
  id?: number;  // Legacy numeric ID (optional, for backwards compatibility)
  name: string;
  email: string;
  establishment_id?: number;
  establishment_name?: string;
}

export interface DeliveryManJWTPayload {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface JWTStrategyOptions {
  secret: string;
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: string = '7d'
): string {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

/**
 * Generate a JWT token for a delivery man
 */
export function generateDeliveryManToken(
  payload: Omit<DeliveryManJWTPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: string = '7d'
): string {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string, secret: string): JWTPayload | DeliveryManJWTPayload {
  try {
    return jwt.verify(token, secret) as JWTPayload | DeliveryManJWTPayload;
  } catch (error: any) {
    throw new Error(`Invalid or expired token: ${error.message}`);
  }
}

/**
 * JWT authentication strategy
 * Attempts to authenticate using a JWT token from the Authorization header
 */
export async function jwtStrategy(
  c: Context,
  options: JWTStrategyOptions
): Promise<AuthResult> {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      valid: false,
      error: 'Missing or invalid Authorization header',
    };
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyToken(token, options.secret);
    return {
      valid: true,
      strategy: 'jwt',
      payload,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'JWT verification failed',
    };
  }
}
