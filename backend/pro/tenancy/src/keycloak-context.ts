/**
 * Keycloak Tenant Context Propagation
 *
 * AsyncLocalStorage-based tenant context propagation for Keycloak-based multi-tenancy.
 *
 * This module provides:
 * 1. TenantContext storage in AsyncLocalStorage for automatic propagation
 * 2. Integration with Keycloak JWT claims (realm, workspace, organization)
 * 3. KeycloakTenantResolver that uses JWT claims instead of database lookups
 *
 * @example
 * ```ts
 * import { setTenantContext, getKeycloakContext, createKeycloakResolver } from '@oxlayer/pro-tenancy';
 *
 * // In auth middleware, set context from JWT
 * setTenantContext({
 *   realm: 'realm-acme',
 *   workspaceId: 'acme-corp',
 *   organizationId: 'acme-corp',
 *   userId: '123',
 *   roles: ['manager'],
 * });
 *
 * // In database layer, get context automatically
 * const context = getKeycloakContext();
 * const dbName = `workspace_${context.realm}_${context.workspaceId}`;
 * ```
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import type { TenantConfig } from './types.js';

/**
 * Keycloak Tenant Context from JWT
 *
 * Extracted from Keycloak JWT token claims.
 * This is the single source of truth for tenant resolution.
 */
export interface KeycloakTenantContext {
  /** Realm (legal/security boundary) - from "realm" claim or issuer */
  realm: string;

  /** Workspace ID (data boundary) - from "workspace.id" claim */
  workspaceId: string;

  /** Organization ID (business boundary) - from "organization.id" claim (optional for members) */
  organizationId?: string;

  /** User ID - from "sub" claim */
  userId: string;

  /** User roles - from "realm_access.roles" or "roles" claim */
  roles: string[];

  /** User email - from "email" claim */
  email?: string;

  /** User type - from "user_type" claim */
  userType?: string;
}

/**
 * AsyncLocalStorage for tenant context
 *
 * Stores the current tenant context for the current async request.
 * This context is automatically propagated to all async operations.
 */
const tenantContextStorage = new AsyncLocalStorage<KeycloakTenantContext>();

/**
 * Set the tenant context for the current async scope
 *
 * Call this in your auth middleware after validating the JWT.
 * The context will be available in all downstream async operations.
 *
 * @param context - Tenant context from Keycloak JWT
 * @param fn - Async function to run with this context
 * @returns Result of the async function
 *
 * @example
 * ```ts
 * app.use('*', async (c, next) => {
 *   const payload = await keycloakStrategy(c, options);
 *   if (payload.valid && payload.tenantContext) {
 *     return setTenantContext(payload.tenantContext, next);
 *   }
 *   await next();
 * });
 * ```
 */
export function setTenantContext<T>(
  context: KeycloakTenantContext,
  fn: () => Promise<T>
): Promise<T> {
  return tenantContextStorage.run(context, fn);
}

/**
 * Get the tenant context for the current async scope
 *
 * Returns the tenant context set by setTenantContext().
 * Returns undefined if no context is set.
 *
 * @returns Tenant context or undefined
 *
 * @example
 * ```ts
 * const context = getKeycloakContext();
 * if (!context) {
 *   throw new Error('No tenant context');
 * }
 * const dbName = `workspace_${context.realm}_${context.workspaceId}`;
 * ```
 */
export function getKeycloakContext(): KeycloakTenantContext | undefined {
  return tenantContextStorage.getStore();
}

/**
 * Require tenant context (throws if not set)
 *
 * Use this in code that requires tenant context to be present.
 *
 * @returns Tenant context
 * @throws Error if no tenant context is set
 *
 * @example
 * ```ts
 * const context = requireKeycloakContext();
 * const dbName = `workspace_${context.realm}_${context.workspaceId}`;
 * ```
 */
export function requireKeycloakContext(): KeycloakTenantContext {
  const context = getKeycloakContext();
  if (!context) {
    throw new Error('Tenant context not set. Call setTenantContext() first.');
  }
  return context;
}

/**
 * Build database name from tenant context
 *
 * Database naming convention: workspace_{realm}_{workspaceId}
 *
 * @param context - Tenant context
 * @returns Database name
 *
 * @example
 * ```ts
 * const dbName = buildDatabaseName(context);
 * // => "workspace_realm-acme_acme-corp"
 * ```
 */
export function buildDatabaseName(context: KeycloakTenantContext): string {
  return `workspace_${context.realm}_${context.workspaceId}`;
}

/**
 * Keycloak Tenant Resolver
 *
 * TenantResolver implementation that uses Keycloak JWT claims
 * instead of loading from a database.
 *
 * This resolver:
 * 1. Reads tenant context from AsyncLocalStorage (set by auth middleware)
 * 2. Constructs TenantConfig on-the-fly from JWT claims
 * 3. No database lookup needed - all info comes from JWT
 *
 * @example
 * ```ts
 * import { createKeycloakResolver } from '@oxlayer/pro-tenancy';
 *
 * const resolver = createKeycloakResolver({
 *   defaultHost: 'localhost',
 *   defaultPort: 5432,
 *   defaultUser: 'postgres',
 *   secretRefPrefix: 'tenants/',
 * });
 *
 * const tenant = await resolver.resolve('workspace-123');
 * // Returns TenantConfig constructed from JWT claims
 * ```
 */
export class KeycloakTenantResolver {
  private cache = new Map<string, { config: TenantConfig; expiresAt: number }>();
  private hits = 0;
  private misses = 0;

  constructor(private options: KeycloakResolverOptions) {}

  /**
   * Resolve tenant configuration from Keycloak context
   *
   * Unlike traditional tenant resolvers that load from a database,
   * this resolver constructs TenantConfig from JWT claims stored
   * in AsyncLocalStorage.
   *
   * @param tenantId - Ignored (uses workspace ID from context)
   * @returns Tenant configuration
   * @throws Error if tenant context is not set
   */
  async resolve(_tenantId: string): Promise<TenantConfig> {
    const context = requireKeycloakContext();

    // Use workspace ID from context as the effective tenant ID
    const effectiveTenantId = context.workspaceId;
    const cacheKey = `${context.realm}:${effectiveTenantId}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      this.hits++;
      return cached.config;
    }

    this.misses++;

    // Build TenantConfig from Keycloak context
    const config = this.buildTenantConfig(context);

    // Cache for 1 minute
    this.cache.set(cacheKey, {
      config,
      expiresAt: Date.now() + 60_000,
    });

    return config;
  }

  /**
   * Invalidate cached configuration
   *
   * @param tenantId - Tenant ID to invalidate (format: "realm:workspaceId")
   */
  invalidate(tenantId: string): void {
    const context = getKeycloakContext();
    if (context) {
      const cacheKey = `${context.realm}:${context.workspaceId}`;
      this.cache.delete(cacheKey);
    } else {
      this.cache.delete(tenantId);
    }
  }

  /**
   * Clear all cached configurations
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Build TenantConfig from Keycloak context
   */
  private buildTenantConfig(context: KeycloakTenantContext): TenantConfig {
    const dbName = buildDatabaseName(context);

    // Determine isolation mode based on realm
    // Platform realm uses shared, client realms use database isolation
    const isPlatformRealm = context.realm === 'platform' || context.realm.startsWith('realm-platform');
    const isolationMode = isPlatformRealm ? 'shared' : 'database';

    return {
      tenantId: context.workspaceId,
      state: 'ready',
      tier: isolationMode === 'database' ? 'b2b-enterprise' : 'b2c',
      region: this.options.defaultRegion || 'us-east-1',
      isolation: {
        database: isolationMode,
      },
      database: {
        host: this.options.defaultHost,
        port: this.options.defaultPort,
        name: dbName,
        user: this.options.defaultUser,
        secretRef: `${this.options.secretRefPrefix}${context.realm}/${context.workspaceId}`,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

/**
 * Keycloak resolver options
 */
export interface KeycloakResolverOptions {
  /** Default database host */
  defaultHost: string;

  /** Default database port */
  defaultPort: number;

  /** Default database user */
  defaultUser: string;

  /** Prefix for secret references */
  secretRefPrefix: string;

  /** Default region for data residency */
  defaultRegion?: string;
}

/**
 * Create a Keycloak tenant resolver
 *
 * Factory function for creating a KeycloakTenantResolver.
 *
 * @param options - Resolver options
 * @returns Keycloak tenant resolver
 *
 * @example
 * ```ts
 * const resolver = createKeycloakResolver({
 *   defaultHost: 'localhost',
 *   defaultPort: 5432,
 *   defaultUser: 'postgres',
 *   secretRefPrefix: 'tenants/',
 * });
 * ```
 */
export function createKeycloakResolver(
  options: KeycloakResolverOptions
): KeycloakTenantResolver {
  return new KeycloakTenantResolver(options);
}

/**
 * Hono middleware for setting tenant context
 *
 * Extracts tenant context from Hono context variables (set by auth middleware)
 * and stores it in AsyncLocalStorage for downstream use.
 *
 * @example
 * ```ts
 * import { keycloakTenantContextMiddleware } from '@oxlayer/pro-tenancy';
 *
 * app.use('*', keycloakTenantContextMiddleware());
 *
 * // Now database resolvers can access tenant context automatically
 * const db = await tenancy.database.resolve('any-id');
 * ```
 */
export function keycloakTenantContextMiddleware() {
  return async (c: any, next: any) => {
    const tenantContext = c.get('tenantContext');

    if (tenantContext) {
      return setTenantContext(tenantContext, next);
    }

    await next();
  };
}
