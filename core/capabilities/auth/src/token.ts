/**
 * Token Generation Module
 *
 * Provides utilities for generating authentication tokens.
 * Supports anonymous users, Keycloak login, and tenant-specific tokens.
 */

import {
  generateToken,
  type JWTPayload,
} from './strategies/jwt.js';

/**
 * Token generation request schemas
 */
export interface GenerateAnonymousTokenInput {
  userId: string;
  metadata?: Record<string, unknown>;
}

export interface GenerateKeycloakTokenInput {
  username: string;
  password: string;
  realm?: string;
}

export interface GenerateTenantTokenInput {
  userId: string;
  tenantId: string;
  tenantName?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Token generation response
 */
export interface TokenResponse {
  token: string;
  type: 'anonymous' | 'keycloak' | 'tenant';
  expiresIn: string;
  payload?: JWTPayload;
}

/**
 * Token generation options
 */
export interface TokenGeneratorOptions {
  /**
   * JWT secret for signing tokens
   */
  secret: string;

  /**
   * Default token expiration time
   * @default '7d'
   */
  expiresIn?: string;

  /**
   * Enable tenant-specific token generation
   * @default false
   */
  enableTenancy?: boolean;

  /**
   * Keycloak configuration (for Keycloak token generation)
   */
  keycloak?: {
    url: string;
    realm: string;
    clientId: string;
    clientSecret?: string;
  };
}

/**
 * Generate an anonymous user token
 *
 * @param input - Anonymous token request
 * @param options - Token generator options
 * @returns Token response
 */
export function generateAnonymousToken(
  input: GenerateAnonymousTokenInput,
  options: TokenGeneratorOptions
): TokenResponse {
  const { secret, expiresIn = '7d' } = options;

  const payload: JWTPayload = {
    sub: input.userId,  // Use userId as the JWT standard 'sub' field
    name: `Anonymous_${input.userId}`,
    email: `${input.userId}@anonymous.local`,
    ...input.metadata,
  };

  const token = generateToken(payload, secret, expiresIn);

  return {
    token,
    type: 'anonymous',
    expiresIn,
    payload,
  };
}

/**
 * Generate a token with tenant context
 *
 * @param input - Tenant token request
 * @param options - Token generator options
 * @returns Token response
 */
export function generateTenantToken(
  input: GenerateTenantTokenInput,
  options: TokenGeneratorOptions
): TokenResponse {
  if (!options.enableTenancy) {
    throw new Error('Tenancy is not enabled. Set enableTenancy: true in options.');
  }

  const { secret, expiresIn = '7d' } = options;

  const payload: JWTPayload & { tenant_id?: string; tenant_name?: string } = {
    sub: input.userId,  // Use userId as the JWT standard 'sub' field
    name: `User_${input.userId}`,
    email: `${input.userId}@local`,
    tenant_id: input.tenantId,
    tenant_name: input.tenantName,
    ...input.metadata,
  };

  const token = generateToken(
    payload as any,
    secret,
    expiresIn
  );

  return {
    token,
    type: 'tenant',
    expiresIn,
    payload: payload as any,
  };
}

/**
 * Generate a token via Keycloak login
 *
 * @param input - Keycloak login request
 * @param options - Token generator options
 * @returns Token response
 */
export async function generateKeycloakToken(
  input: GenerateKeycloakTokenInput,
  options: TokenGeneratorOptions
): Promise<TokenResponse> {
  if (!options.keycloak) {
    throw new Error('Keycloak is not configured. Provide keycloak configuration in options.');
  }

  const { keycloak } = options;
  const keycloakUrl = keycloak.url.replace(/\/$/, '');
  const realm = input.realm || keycloak.realm;
  const tokenEndpoint = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: keycloak.clientId,
      client_secret: keycloak.clientSecret || '',
      username: input.username,
      password: input.password,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Keycloak authentication failed: ${error}`);
  }

  const data = await response.json() as {
    access_token: string;
    expires_in: number;
  };

  return {
    token: data.access_token,
    type: 'keycloak',
    expiresIn: `${data.expires_in}s`,
  };
}
