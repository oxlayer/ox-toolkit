import type { JWTPayload, DeliveryManJWTPayload } from './strategies/index.js';
import type { TenantContext } from './keycloak/types.js';

export interface AuthMiddlewareOptions {
  /**
   * Enable Keycloak authentication
   */
  enableKeycloak?: boolean;

  /**
   * Keycloak configuration
   */
  keycloak?: {
    url: string;
    realm: string;
    clientId?: string;
    clientSecret?: string;
  };

  /**
   * Enable JWT authentication (internal auth)
   */
  enableJwt?: boolean;

  /**
   * JWT secret for token verification and generation
   */
  jwtSecret?: string;

  /**
   * Public paths that bypass authentication
   */
  publicPaths?: string[];

  /**
   * Admin-only routes (accessible without organization_id)
   */
  adminOnlyRoutes?: string[];

  /**
   * Enable tenant context extraction from authentication tokens
   * When false (default), auth is tenant-agnostic and no tenant context is set
   * When true, tenant_id is extracted from JWT claims or organization_id
   *
   * @default false
   */
  enableTenancy?: boolean;

  /**
   * Token generation routes configuration
   * When enabled, automatically registers token generation endpoints
   */
  tokenRoutes?: {
    /**
     * Enable anonymous token generation endpoint
     * POST /auth/token/anonymous
     * @default false
     */
    enableAnonymous?: boolean;

    /**
     * Enable Keycloak token generation endpoint
     * POST /auth/token/keycloak
     * @default false
     */
    enableKeycloak?: boolean;

    /**
     * Enable tenant token generation endpoint
     * POST /auth/token/tenant
     * Only works if enableTenancy is true
     * @default false
     */
    enableTenant?: boolean;

    /**
     * Custom path prefix for token routes
     * @default '/auth'
     */
    pathPrefix?: string;

    /**
     * Default token expiration time
     * @default '7d'
     */
    expiresIn?: string;
  };
}

export interface AuthResult {
  valid: boolean;
  strategy?: 'keycloak' | 'jwt';
  payload?: JWTPayload | DeliveryManJWTPayload | any;
  error?: string;
  /** Tenant context (if available from authentication) */
  tenantContext?: TenantContext;
}

declare module 'hono' {
  interface ContextVariableMap {
    authStrategy: 'keycloak' | 'jwt' | 'none';
    authPayload: JWTPayload | DeliveryManJWTPayload | any;
    isAuthenticated: boolean;
    /** Tenant context (set by auth middleware) */
    tenantContext?: TenantContext;
    /** Tenant ID (convenient access) */
    tenantId?: string;
  }
}
