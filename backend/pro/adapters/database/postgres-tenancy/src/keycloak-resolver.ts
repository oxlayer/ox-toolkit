/**
 * Keycloak Workspace Database Resolver
 *
 * PostgreSQL database resolver for Keycloak-based multi-tenancy.
 *
 * This resolver:
 * - Uses AsyncLocalStorage to get tenant context from JWT claims
 * - Builds database names using workspace convention: workspace_{realm}_{workspaceId}
 * - Creates connections to tenant-specific databases
 *
 * @example
 * ```ts
 * import { KeycloakDatabaseResolver, getKeycloakDatabase } from '@oxlayer/pro-adapters-postgres-tenancy';
 * import { setTenantContext } from '@oxlayer/pro-tenancy';
 *
 * const resolver = new KeycloakDatabaseResolver({
 *   baseHost: 'localhost',
 *   basePort: 5432,
 *   baseUser: 'postgres',
 *   getCredentials: async (secretRef) => ({ username, password }),
 * });
 *
 * // Set tenant context from JWT
 * await setTenantContext({
 *   realm: 'realm-acme',
 *   workspaceId: 'acme-corp',
 *   userId: '123',
 *   roles: ['manager'],
 * }, async () => {
 *   // Resolve database for this workspace
 *   const db = await resolver.resolve('any-id');
 *   // => Connects to database: workspace_realm-acme_acme-corp
 * });
 * ```
 */

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import type { Database, DatabaseCredentials } from "./tenancy-aware-postgres.js";

// Dynamic import for pro-tenancy to avoid DTS issues
let tenancyModule: any;
async function getTenancyModule() {
  if (!tenancyModule) {
    tenancyModule = await import("@oxlayer/pro-tenancy");
  }
  return tenancyModule;
}

/**
 * Keycloak Tenant Context from JWT
 *
 * Extracted from Keycloak JWT token claims.
 * This is the single source of truth for tenant resolution.
 *
 * NOTE: This type is duplicated from @oxlayer/pro-tenancy/keycloak-context
 * to avoid DTS build issues with optional peer dependencies.
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
 * Credentials resolver function
 *
 * Called with a secret reference to fetch database credentials.
 * The secret reference format is: tenants/{realm}/{workspaceId}
 */
export type CredentialsResolver = (secretRef: string) => Promise<DatabaseCredentials>;

/**
 * Keycloak database resolver options
 */
export interface KeycloakDatabaseResolverOptions {
  /** Base database host (can be overridden in credentials) */
  baseHost: string;

  /** Base database port */
  basePort: number;

  /** Base database user (username, not password) */
  baseUser: string;

  /** SSL configuration */
  ssl?: boolean | { rejectUnauthorized: boolean };

  /** Connection pool size per tenant database */
  poolSize?: number;

  /** Function to resolve credentials from secret reference */
  getCredentials: CredentialsResolver;
}

/**
 * Cached database connection
 */
interface CachedConnection {
  db: PostgresJsDatabase<any>;
  client: Sql;
  expiresAt: number;
}

/**
 * Keycloak Workspace Database Resolver
 *
 * Resolves PostgreSQL databases for Keycloak-based multi-tenancy.
 * Database naming convention: workspace_{realm}_{workspaceId}
 *
 * Features:
 * - AsyncLocalStorage-based tenant context propagation
 * - Connection pooling per workspace database
 * - Cached connections with TTL
 * - Automatic credential resolution from secret store
 */
export class KeycloakDatabaseResolver {
  private connections = new Map<string, CachedConnection>();
  private readonly defaultTtl = 300_000; // 5 minutes

  constructor(private options: KeycloakDatabaseResolverOptions) {}

  /**
   * Resolve database for current tenant context
   *
   * The tenantId parameter is ignored - the actual tenant info comes from
   * AsyncLocalStorage (set by auth middleware from Keycloak JWT claims).
   *
   * @param _tenantId - Ignored (uses workspace ID from context)
   * @returns Drizzle database instance for tenant's workspace database
   * @throws Error if tenant context is not set
   */
  async resolve(_tenantId: string): Promise<Database> {
    const tenancy = await getTenancyModule();
    const context = tenancy.requireKeycloakContext() as KeycloakTenantContext;
    const dbName = this.buildDatabaseName(context);
    const cacheKey = this.buildCacheKey(context);

    // Check for cached connection
    const cached = this.connections.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.db;
    }

    // Create new connection
    const connection = await this.createConnection(context, dbName);

    // Cache with TTL
    this.connections.set(cacheKey, {
      ...connection,
      expiresAt: Date.now() + this.defaultTtl,
    });

    return connection.db;
  }

  /**
   * Close database connection for a specific tenant
   *
   * @param context - Tenant context (if omitted, uses current context)
   */
  async close(context?: KeycloakTenantContext): Promise<void> {
    let ctx = context;

    if (!ctx) {
      const tenancy = await getTenancyModule();
      ctx = tenancy.getKeycloakContext() as KeycloakTenantContext | undefined;
    }

    if (!ctx) return;

    const cacheKey = this.buildCacheKey(ctx);
    const cached = this.connections.get(cacheKey);

    if (cached) {
      await cached.client.end();
      this.connections.delete(cacheKey);
    }
  }

  /**
   * Close all database connections
   */
  async closeAll(): Promise<void> {
    await Promise.all(
      [...this.connections.values()].map((conn) => conn.client.end())
    );
    this.connections.clear();
  }

  /**
   * Get connection pool statistics
   */
  getStats() {
    return {
      poolCount: this.connections.size,
      keys: Array.from(this.connections.keys()),
    };
  }

  /**
   * Build database name from Keycloak tenant context
   *
   * Convention: workspace_{realm}_{workspaceId}
   *
   * @param context - Keycloak tenant context
   * @returns Database name
   */
  private buildDatabaseName(context: KeycloakTenantContext): string {
    return `workspace_${context.realm}_${context.workspaceId}`;
  }

  /**
   * Build cache key from tenant context
   *
   * @param context - Keycloak tenant context
   * @returns Cache key
   */
  private buildCacheKey(context: KeycloakTenantContext): string {
    return `${context.realm}:${context.workspaceId}`;
  }

  /**
   * Create database connection for tenant
   *
   * @param context - Keycloak tenant context
   * @param dbName - Database name
   * @returns Database connection
   */
  private async createConnection(
    context: KeycloakTenantContext,
    dbName: string
  ): Promise<{ db: PostgresJsDatabase<any>; client: Sql }> {
    // Build secret reference
    const secretRef = `tenants/${context.realm}/${context.workspaceId}`;

    // Resolve credentials
    const credentials = await this.options.getCredentials(secretRef);

    // Build connection config
    const host = credentials.host || this.options.baseHost;
    const port = credentials.port || this.options.basePort;
    const user = credentials.username;
    const password = credentials.password;

    // Create connection string
    const connectionString = `postgresql://${user}:${password}@${host}:${port}/${dbName}`;

    // Create postgres client
    const client = postgres(connectionString, {
      max: this.options.poolSize || 10,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: this.options.ssl,
    });

    // Create Drizzle instance
    const db = drizzle(client);

    return { db, client };
  }
}

/**
 * Helper function to get database for current Keycloak tenant context
 *
 * Convenience function that resolves the database using the current
 * AsyncLocalStorage tenant context.
 *
 * @param resolver - Keycloak database resolver
 * @returns Drizzle database instance
 *
 * @example
 * ```ts
 * import { getKeycloakDatabase } from '@oxlayer/pro-adapters-postgres-tenancy';
 *
 * const db = await getKeycloakDatabase(resolver);
 * const users = await db.select().from(usersTable);
 * ```
 */
export async function getKeycloakDatabase(
  resolver: KeycloakDatabaseResolver
): Promise<Database> {
  return resolver.resolve("unused");
}

/**
 * Helper function to create a Keycloak database resolver
 *
 * Factory function for creating a KeycloakDatabaseResolver.
 *
 * @param options - Resolver options
 * @returns Keycloak database resolver
 *
 * @example
 * ```ts
 * import { createKeycloakDatabaseResolver } from '@oxlayer/pro-adapters-postgres-tenancy';
 *
 * const resolver = createKeycloakDatabaseResolver({
 *   baseHost: 'localhost',
 *   basePort: 5432,
 *   baseUser: 'postgres',
 *   getCredentials: async (secretRef) => {
 *     // Fetch credentials from your secret store
 *     return { username: 'user', password: 'pass' };
 *   },
 * });
 * ```
 */
export function createKeycloakDatabaseResolver(
  options: KeycloakDatabaseResolverOptions
): KeycloakDatabaseResolver {
  return new KeycloakDatabaseResolver(options);
}
