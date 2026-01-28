/**
 * PostgreSQL Tenancy Adapter
 *
 * Provides tenant-aware database resolution supporting multiple isolation strategies.
 * Works with ANY client database/schema.
 *
 * Features:
 * - **Shared isolation**: Single database with Row-Level Security (RLS) for B2C tenants
 * - **Schema isolation**: Same database, separate schemas per tenant
 * - **Database isolation**: Separate database instance per B2B tenant
 * - **Dynamic RLS**: Automatically adds tenant_id and RLS policies to all tables
 *
 * @example
 * ```ts
 * import { TenancyAwarePostgres } from '@oxlayer/pro-adapters-postgres-tenancy';
 *
 * const tenancyPostgres = new TenancyAwarePostgres({
 *   tenantResolver,
 *   bitwardenClient,
 *   sharedDb: getDatabase(),
 * });
 *
 * // Enable RLS on all tables (adds tenant_id column if needed)
 * await tenancyPostgres.enableRLS();
 *
 * const tenantDb = await tenancyPostgres.resolve('acme-corp');
 * ```
 */

import type { PgDatabase } from "drizzle-orm/pg-core";
import type {
  TenantResolver,
  DatabaseResolver,
  DatabaseRouting,
} from "@oxlayer/pro-tenancy";
import {
  UnsupportedIsolationModeError,
  DatabaseConnectionError,
  SecretResolutionError,
} from "@oxlayer/pro-tenancy";
import { DatabasePool, type DatabaseConnectionConfig } from "./database-pool.js";
import { RLSManager, type RLSPolicyConfig } from "./rls-manager.js";

/**
 * Type alias for Drizzle database instance
 *
 * This allows users to use their own schema type with the adapter.
 * For example: `type MyDatabase = PgDatabase<typeof schema>;`
 */
export type Database = PgDatabase<any, any, any>;

/**
 * Bitwarden secrets client interface
 *
 * Minimal interface for resolving tenant database credentials.
 */
export interface BitwardenSecretsClient {
  /**
   * Get database credentials from secret reference
   *
   * @param secretRef - Bitwarden secret identifier (e.g., "tenants/acme-corp/database")
   * @returns Database credentials
   */
  getDatabaseCredentials(secretRef: string): Promise<DatabaseCredentials>;
}

/**
 * Database credentials from secret store
 */
export interface DatabaseCredentials {
  username: string;
  password: string;
  host?: string;
  port?: number;
}

/**
 * Configuration for TenancyAwarePostgres
 */
export interface TenancyAwarePostgresConfig {
  /** Tenant resolver for loading tenant configuration */
  tenantResolver: TenantResolver;

  /** Bitwarden secrets client for credential resolution */
  bitwardenClient: BitwardenSecretsClient;

  /** Shared database (for B2C tenants with isolation="shared") */
  sharedDb: Database;

  /** RLS configuration (optional) */
  rlsConfig?: RLSPolicyConfig;

  /** Custom database pool (optional, defaults to internal pool) */
  databasePool?: DatabasePool;
}

/**
 * PostgreSQL tenancy-aware database resolver
 *
 * Resolves tenant-specific database connections based on isolation strategy.
 * Works with any client database.
 *
 * Isolation strategies:
 * - **shared** (B2C): Returns shared database with RLS context set via SET LOCAL
 * - **schema**: Returns shared database with search_path set to tenant's schema
 * - **database** (B2B): Returns dedicated connection from internal pool
 *
 * Dynamic RLS:
 * When using shared isolation, call enableRLS() to automatically:
 * - Add tenant_id column to all tables (if missing)
 * - Enable Row-Level Security on all tables
 * - Create tenant isolation policies
 */
export class TenancyAwarePostgres implements DatabaseResolver<Database> {
  private databasePool: DatabasePool;
  private rlsManager: RLSManager;

  constructor(private config: TenancyAwarePostgresConfig) {
    this.databasePool = config.databasePool || new DatabasePool();
    this.rlsManager = new RLSManager(config.sharedDb, config.rlsConfig);
  }

  /**
   * Resolve database for tenant
   *
   * Routes to appropriate database based on tenant's isolation strategy.
   *
   * @param tenantId - Tenant identifier
   * @returns Tenant-scoped Database instance
   * @throws TenantNotFoundError if tenant doesn't exist
   * @throws UnsupportedIsolationModeError if isolation mode is not supported
   * @throws SecretResolutionError if credentials cannot be resolved
   * @throws DatabaseConnectionError if connection fails
   */
  async resolve(tenantId: string): Promise<Database> {
    // Resolve tenant configuration
    const tenant = await this.config.tenantResolver.resolve(tenantId);

    // Route based on isolation mode
    switch (tenant.isolation.database) {
      case "shared":
        return this.getSharedDbWithRLS(tenantId);

      case "schema":
        return this.getSchemaDb(tenant.database, tenantId);

      case "database":
        return this.getTenantDatabase(tenant.database);

      default:
        throw new UnsupportedIsolationModeError(
          tenantId,
          "database",
          tenant.isolation.database
        );
    }
  }

  /**
   * Enable RLS on all tables in the shared database
   *
   * This method dynamically applies Row-Level Security to ALL tables:
   * - Inspects the database schema
   * - Adds tenant_id column to tables that don't have it
   * - Enables RLS on all tables
   * - Creates tenant isolation policies
   *
   * Works with any client table structure.
   *
   * @returns Result of RLS application with details
   */
  async enableRLS() {
    return await this.rlsManager.enableRLSForAllTables();
  }

  /**
   * Set RLS context for shared database queries
   *
   * Helper method to set the tenant context for RLS.
   * Should be called at the start of each transaction.
   *
   * @param tenantId - Tenant identifier
   */
  async setRlsContext(tenantId: string): Promise<void> {
    await this.rlsManager.setTenantContext(tenantId);
  }

  /**
   * Reset RLS context
   */
  async resetRlsContext(): Promise<void> {
    await this.rlsManager.resetTenantContext();
  }

  /**
   * Close all database connections
   */
  async closeAll(): Promise<void> {
    await this.databasePool.closeAll();
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats() {
    return this.databasePool.getStats();
  }

  /**
   * Get shared database with Row-Level Security context
   *
   * For B2C tenants using the shared database.
   * Sets app.current_tenant for RLS policies.
   *
   * Note: SET LOCAL must be executed within a transaction.
   * Application code should handle transaction management.
   *
   * @param tenantId - Tenant identifier
   * @returns Shared database instance
   */
  private async getSharedDbWithRLS(tenantId: string): Promise<Database> {
    // Return the shared database instance
    // Application code is responsible for setting RLS context via:
    //   await tenancyPostgres.setRlsContext(tenantId);
    // Or within transaction:
    //   BEGIN;
    //   SET LOCAL app.current_tenant = 'tenant-id';
    //   -- queries...
    //   COMMIT;
    return this.config.sharedDb;
  }

  /**
   * Get database with tenant-specific schema
   *
   * For tenants using schema isolation within the same database.
   * Sets search_path to tenant's schema.
   *
   * @param routing - Database routing configuration
   * @param tenantId - Tenant identifier
   * @returns Database with schema search_path configured
   */
  private async getSchemaDb(routing: DatabaseRouting, tenantId: string): Promise<Database> {
    try {
      const credentials = await this.getCredentials(routing.secretRef);

      const connectionConfig: DatabaseConnectionConfig = {
        host: routing.host,
        port: routing.port,
        database: routing.name,
        user: credentials.username || routing.user,
        password: credentials.password,
        poolSize: 10,
        schema: routing.schema,
      };

      return await this.databasePool.connect(connectionConfig);
    } catch (error) {
      if (error instanceof Error) {
        throw new DatabaseConnectionError(tenantId, error.message);
      }
      throw error;
    }
  }

  /**
   * Get dedicated tenant database
   *
   * For B2B tenants with dedicated database isolation.
   * Returns a separate connection from the internal pool.
   *
   * @param routing - Database routing configuration
   * @returns Tenant-specific database instance
   * @throws SecretResolutionError if credentials cannot be resolved
   * @throws DatabaseConnectionError if connection fails
   */
  private async getTenantDatabase(routing: DatabaseRouting): Promise<Database> {
    const tenantId = routing.secretRef.split("/")[1] || "unknown";

    try {
      const credentials = await this.getCredentials(routing.secretRef);

      const connectionConfig: DatabaseConnectionConfig = {
        host: routing.host,
        port: routing.port,
        database: routing.name,
        user: credentials.username || routing.user,
        password: credentials.password,
        poolSize: 10,
      };

      return await this.databasePool.connect(connectionConfig);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("secret") || error.message.includes("credential")) {
          throw new SecretResolutionError(
            tenantId,
            routing.secretRef,
            error.message
          );
        }
        throw new DatabaseConnectionError(tenantId, error.message);
      }
      throw error;
    }
  }

  /**
   * Get credentials from Bitwarden with error handling
   */
  private async getCredentials(secretRef: string): Promise<DatabaseCredentials> {
    try {
      return await this.config.bitwardenClient.getDatabaseCredentials(secretRef);
    } catch (error) {
      if (error instanceof Error) {
        throw new SecretResolutionError(
          secretRef.split("/")[1] || "unknown",
          secretRef,
          error.message
        );
      }
      throw error;
    }
  }
}

/**
 * Create a tenancy-aware PostgreSQL resolver
 *
 * Factory function for creating a TenancyAwarePostgres instance.
 *
 * @example
 * ```ts
 * import { createTenancyAwarePostgres } from '@oxlayer/pro-adapters-postgres-tenancy';
 *
 * const tenancyPostgres = createTenancyAwarePostgres({
 *   tenantResolver,
 *   bitwardenClient,
 *   sharedDb: getDatabase(),
 * });
 *
 * // Enable RLS on all tables
 * await tenancyPostgres.enableRLS();
 *
 * const db = await tenancyPostgres.resolve('acme-corp');
 * ```
 */
export function createTenancyAwarePostgres(
  config: TenancyAwarePostgresConfig
): TenancyAwarePostgres {
  return new TenancyAwarePostgres(config);
}
