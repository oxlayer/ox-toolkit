/**
 * Keycloak Database Resolver Configuration
 *
 * Provides a KeycloakDatabaseResolver for workspace-based database isolation.
 * Database names are resolved from the admin database (globex_admin.databases table).
 *
 * @example
 * ```ts
 * import { getKeycloakDatabaseResolver } from './config/database-resolver.config';
 *
 * const resolver = getKeycloakDatabaseResolver();
 * const db = await resolver.resolve('workspace-id');
 * // => Connects to database from globex_admin.databases table
 * ```
 */

import { createKeycloakDatabaseResolver, type KeycloakDatabaseResolver, type KeycloakDatabaseResolverOptions } from '@oxlayer/pro-adapters-postgres-tenancy';
import { ENV } from './app.config.js';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { databases as databasesTable } from '../db/admin-schema.js';

/**
 * Credentials resolver for tenant databases
 *
 * Queries the globex_admin.databases table to get tenant-specific
 * database credentials. The secret reference format is: tenants/{realm}/{workspaceId}
 *
 * For development, falls back to configured POSTGRES_USER and POSTGRES_PASSWORD.
 * In production, this could also fetch from Bitwarden or other secret store.
 */
async function mockCredentialsResolver(secretRef: string): Promise<{ username: string; password: string }> {
  try {
    // Parse secretRef format: tenants/{realm}/{workspaceId}
    const parts = secretRef.split('/');
    if (parts.length >= 3 && parts[0] === 'tenants') {
      const realm = parts[1];
      const workspaceId = parts[2];

      // Query admin database for tenant-specific credentials
      const credentials = await getDatabaseCredentialsForWorkspace(workspaceId, realm);
      return credentials;
    }
  } catch (error) {
    console.error('Failed to get tenant credentials, using defaults:', error);
  }

  // Fallback to default database credentials
  return {
    username: ENV.POSTGRES_USER || 'postgres',
    password: ENV.POSTGRES_PASSWORD || 'postgres',
  };
}

/**
 * Admin database connection for database name lookup
 * Caches connections to avoid creating new connections for each lookup
 */
let adminDbInstance: ReturnType<typeof drizzle> | null = null;

/**
 * Get admin database connection (cached)
 */
async function getAdminDb() {
  if (!adminDbInstance) {
    const client = postgres({
      host: ENV.POSTGRES_HOST || 'localhost',
      port: Number(ENV.POSTGRES_PORT) || 5432,
      database: ENV.POSTGRES_ADMIN_DATABASE || 'globex_admin',
      user: ENV.POSTGRES_USER || 'postgres',
      password: ENV.POSTGRES_PASSWORD || 'postgres',
      max: 1, // Small pool for admin lookups
      idle_timeout: 30,
      connect_timeout: 10,
    });

    adminDbInstance = drizzle(client);
  }

  return adminDbInstance;
}

/**
 * Database name cache
 * Maps workspaceId -> databaseName to avoid repeated admin DB queries
 */
const databaseNameCache = new Map<string, string>();

/**
 * Database credentials cache
 * Maps workspaceId -> {username, password} to avoid repeated admin DB queries
 */
const credentialsCache = new Map<string, { username: string; password: string }>();

/**
 * Get database name from admin database for a workspace
 *
 * Queries the globex_admin.databases table to find the actual database
 * name for a given workspace ID and realm.
 *
 * @param workspaceId - Workspace UUID
 * @param realmId - Realm ID (e.g., "acme" without globex_ prefix)
 * @returns Database name or undefined if not found
 */
export async function getDatabaseNameForWorkspace(workspaceId: string, realmId: string): Promise<string | undefined> {
  // Check cache first
  const cacheKey = `${realmId}:${workspaceId}`;
  const cached = databaseNameCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const adminDb = await getAdminDb();

    // Query the databases table for the workspace
    const results = await adminDb
      .select({ databaseName: databasesTable.databaseName })
      .from(databasesTable)
      .where(eq(databasesTable.workspaceId, workspaceId))
      .limit(1);

    if (results.length > 0) {
      const databaseName = results[0].databaseName;
      // Cache the result
      databaseNameCache.set(cacheKey, databaseName);
      return databaseName;
    }

    // Fallback to pattern-based naming if not found in admin DB
    const fallbackName = `globex_workspace_${realmId}_${workspaceId}`;
    databaseNameCache.set(cacheKey, fallbackName);
    return fallbackName;
  } catch (error) {
    console.error('Failed to query admin database for database name:', error);
    // Fallback to pattern-based naming on error
    const fallbackName = `globex_workspace_${realmId}_${workspaceId}`;
    return fallbackName;
  }
}

/**
 * Get database credentials from admin database for a workspace
 *
 * Queries the globex_admin.databases table to find the database
 * credentials (username and password) for a given workspace ID and realm.
 *
 * @param workspaceId - Workspace UUID
 * @param realmId - Realm ID (e.g., "acme" without globex_ prefix)
 * @returns Database credentials { username, password } or defaults
 */
export async function getDatabaseCredentialsForWorkspace(workspaceId: string, realmId: string): Promise<{ username: string; password: string }> {
  // Check cache first
  const cacheKey = `${realmId}:${workspaceId}`;
  const cached = credentialsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const adminDb = await getAdminDb();

    // Query the databases table for the workspace credentials
    const results = await adminDb
      .select({
        dbUser: databasesTable.dbUser,
        dbPassword: databasesTable.dbPassword,
      })
      .from(databasesTable)
      .where(eq(databasesTable.workspaceId, workspaceId))
      .limit(1);

    if (results.length > 0 && results[0].dbUser && results[0].dbPassword) {
      const credentials = {
        username: results[0].dbUser!,
        password: results[0].dbPassword!,
      };
      // Cache the result
      credentialsCache.set(cacheKey, credentials);
      return credentials;
    }

    // Fallback to default credentials if not found in admin DB
    const defaultCredentials = {
      username: ENV.POSTGRES_USER || 'postgres',
      password: ENV.POSTGRES_PASSWORD || 'postgres',
    };
    credentialsCache.set(cacheKey, defaultCredentials);
    return defaultCredentials;
  } catch (error) {
    console.error('Failed to query admin database for credentials:', error);
    // Fallback to default credentials on error
    const defaultCredentials = {
      username: ENV.POSTGRES_USER || 'postgres',
      password: ENV.POSTGRES_PASSWORD || 'postgres',
    };
    return defaultCredentials;
  }
}

/**
 * Keycloak database resolver options
 */
const keycloakDatabaseResolverOptions: KeycloakDatabaseResolverOptions = {
  baseHost: ENV.POSTGRES_HOST || 'localhost',
  basePort: ENV.POSTGRES_PORT || 5432,
  baseUser: ENV.POSTGRES_USER || 'postgres',
  poolSize: 10,
  ssl: ENV.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  getCredentials: mockCredentialsResolver,
  // Custom database name resolver that queries admin database
  getDatabaseName: async (realm: string, workspaceId: string) => {
    const databaseName = await getDatabaseNameForWorkspace(workspaceId, realm);
    return databaseName || `globex_workspace_${realm}_${workspaceId}`;
  },
} as any; // Type assertion to allow getDatabaseName option

/**
 * Global Keycloak database resolver instance
 *
 * This resolver uses AsyncLocalStorage to get the tenant context
 * from the JWT token and automatically connects to the correct workspace database.
 */
let keycloakDatabaseResolver: KeycloakDatabaseResolver | null = null;

/**
 * Get or create the Keycloak database resolver
 *
 * @returns KeycloakDatabaseResolver instance
 *
 * @example
 * ```ts
 * const resolver = getKeycloakDatabaseResolver();
 * const db = await resolver.resolve('any-id');
 * // => Connects to globex_workspace_realm_workspaceId based on JWT claims
 * ```
 */
export function getKeycloakDatabaseResolver(): KeycloakDatabaseResolver {
  if (!keycloakDatabaseResolver) {
    keycloakDatabaseResolver = createKeycloakDatabaseResolver(keycloakDatabaseResolverOptions);
  }
  return keycloakDatabaseResolver;
}

/**
 * Resolve database for current tenant context
 *
 * Convenience function that resolves the database for the current
 * Keycloak tenant context (set by auth middleware).
 *
 * Database names are resolved from the globex_admin.databases table,
 * which maps workspace IDs to their actual database names.
 *
 * @returns Drizzle database instance
 *
 * @example
 * ```ts
 * import { getTenantDatabase } from './config/database-resolver.config';
 *
 * const db = await getTenantDatabase();
 * const users = await db.select().from(usersTable);
 * ```
 */
export async function getTenantDatabase() {
  const resolver = getKeycloakDatabaseResolver();
  return resolver.resolve('unused');
}

/**
 * Get database name from tenant context (synchronous, for logging)
 *
 * This is a simplified version for logging/debugging that constructs
 * the database name from the pattern. The actual database resolution
 * happens asynchronously in the resolver and queries the admin database.
 *
 * @returns Database name or undefined if no tenant context
 *
 * @example
 * ```ts
 * import { getDatabaseName } from './config/database-resolver.config';
 *
 * const dbName = getDatabaseName();
 * console.log(`Using database: ${dbName}`);
 * // => "globex_workspace_realm_workspace-id"
 * ```
 */
export function getDatabaseName(): string | undefined {
  // Try to get context from AsyncLocalStorage
  const context = (globalThis as any).__tenant_context__;
  if (context) {
    return `globex_workspace_${context.realm}_${context.workspaceId}`;
  }
  return undefined;
}

/**
 * Close all database connections
 *
 * Call this during application shutdown.
 *
 * @example
 * ```ts
 * import { shutdownDatabaseResolver } from './config/database-resolver.config';
 *
 * await shutdownDatabaseResolver();
 * ```
 */
export async function shutdownDatabaseResolver() {
  if (keycloakDatabaseResolver) {
    await keycloakDatabaseResolver.closeAll();
    keycloakDatabaseResolver = null;
  }
}

/**
 * Clear credentials cache for a specific workspace
 *
 * Call this after rotating tenant credentials to force a refresh.
 *
 * @param workspaceId - Workspace UUID to clear from cache
 *
 * @example
 * ```ts
 * import { clearCredentialsCache } from './config/database-resolver.config';
 *
 * await clearCredentialsCache('workspace-uuid');
 * ```
 */
export function clearCredentialsCache(workspaceId: string): void {
  // Clear any cached credentials for this workspace
  for (const [key, _] of credentialsCache.entries()) {
    if (key.endsWith(`:${workspaceId}`)) {
      credentialsCache.delete(key);
    }
  }

  // Also clear the database name cache for this workspace
  for (const [key, _] of databaseNameCache.entries()) {
    if (key.endsWith(`:${workspaceId}`)) {
      databaseNameCache.delete(key);
    }
  }
}
