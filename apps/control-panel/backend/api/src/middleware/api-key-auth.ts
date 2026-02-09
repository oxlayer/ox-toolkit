/**
 * API Key Authentication Middleware
 *
 * Middleware for authenticating requests using API keys.
 * This is used for SDK requests to the capability resolution endpoints.
 */

import type { IApiKeyRepository } from '../repositories/index.js';
import type { ApiKey, License } from '../domain/index.js';
import { UnauthorizedError } from '@oxlayer/foundation-domain-kit';
import { createHash } from 'crypto';

/**
 * Authenticated request context
 */
export interface AuthContext {
  apiKey: ApiKey;
  license: License;
  organizationId: string;
}

/**
 * Extract API key from request
 *
 * Supports multiple extraction methods:
 * - Authorization header: `Authorization: Bearer oxl_...`
 * - X-API-Key header: `X-API-Key: oxl_...`
 * - Query parameter: `?api_key=oxl_...`
 */
export function extractApiKey(request: Request): string | null {
  // Try Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try X-API-Key header
  const apiKeyHeader = request.headers.get('X-API-Key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // Try query parameter (only for GET requests)
  if (request.method === 'GET') {
    const url = new URL(request.url);
    return url.searchParams.get('api_key');
  }

  return null;
}

/**
 * API Key Authentication Middleware
 *
 * Validates the API key and adds the auth context to the request.
 */
export class ApiKeyAuthMiddleware {
  constructor(
    private readonly apiKeyRepo: IApiKeyRepository,
    private readonly licenseRepo: import('../repositories/index.js').ILicenseRepository
  ) {}

  /**
   * Authenticate a request using API key
   *
   * @param request - The incoming request
   * @returns The authentication context
   * @throws UnauthorizedError if authentication fails
   */
  async authenticate(request: Request): Promise<AuthContext> {
    const rawApiKey = extractApiKey(request);

    if (!rawApiKey) {
      throw new UnauthorizedError('Missing API key');
    }

    if (!rawApiKey.startsWith('oxl_')) {
      throw new UnauthorizedError('Invalid API key format');
    }

    // Hash the API key to lookup in database
    const keyHash = createHash('sha256').update(rawApiKey).digest('hex');

    const apiKey = await this.apiKeyRepo.findByKeyHash(keyHash);
    if (!apiKey) {
      throw new UnauthorizedError('Invalid API key');
    }

    if (!apiKey.isValid()) {
      throw new UnauthorizedError(
        `API key is not valid (status: ${apiKey.status})`
      );
    }

    const license = await this.licenseRepo.findById(apiKey.licenseId);
    if (!license) {
      throw new UnauthorizedError('Associated license not found');
    }

    if (!license.isValid()) {
      throw new UnauthorizedError(
        `License is not valid (status: ${license.status})`
      );
    }

    return {
      apiKey,
      license,
      organizationId: license.organizationId,
    };
  }

  /**
   * Create a middleware function for use with web frameworks
   *
   * This returns a function that can be used as middleware.
   */
  createMiddleware() {
    return async (request: Request): Promise<AuthContext> => {
      return this.authenticate(request);
    };
  }

  /**
   * Check if API key has required scope
   */
  hasScope(authContext: AuthContext, scope: string): boolean {
    return authContext.apiKey.hasScope(scope as any);
  }

  /**
   * Check if API key can be used in environment
   */
  canUseInEnvironment(authContext: AuthContext, environment: string): boolean {
    return authContext.apiKey.canBeUsedIn(environment as any);
  }

  /**
   * Require specific scope(s)
   *
   * Throws if API key doesn't have the required scope
   */
  requireScope(authContext: AuthContext, scope: string | string[]): void {
    const scopes = Array.isArray(scope) ? scope : [scope];

    for (const s of scopes) {
      if (!this.hasScope(authContext, s)) {
        throw new UnauthorizedError(
          `API key does not have required scope: ${s}`
        );
      }
    }
  }

  /**
   * Require specific environment access
   *
   * Throws if API key can't be used in the requested environment
   */
  requireEnvironment(authContext: AuthContext, environment: string): void {
    if (!this.canUseInEnvironment(authContext, environment)) {
      throw new UnauthorizedError(
        `API key is not authorized for environment: ${environment}`
      );
    }
  }
}

export type { AuthContext };
