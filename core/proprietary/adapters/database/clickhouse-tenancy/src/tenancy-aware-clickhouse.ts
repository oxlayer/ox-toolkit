/**
 * ClickHouse Tenancy Adapter
 *
 * Multi-tenant ClickHouse analytics adapter supporting:
 * - Shared: Single database with tenant_id filtering (B2C)
 * - Database: Separate database per tenant (B2B)
 * - Table: Separate table per tenant (mixed)
 *
 * @example
 * ```ts
 * import { createTenancyAwareClickHouse } from '@oxlayer/pro-adapters-clickhouse-tenancy';
 *
 * const tenantCH = createTenancyAwareClickHouse({
 *   tenantResolver,
 *   bitwardenClient,
 * });
 *
 * const ch = await tenantCH.resolve('acme-corp');
 * const result = await ch.query('SELECT * FROM events WHERE date >= {min:String}');
 * ```
 */

import type { TenantResolver } from '@oxlayer/pro-tenancy';
import type { BitwardenSecretsClient } from '@oxlayer/capabilities-adapters-bitwarden-secrets';

/**
 * ClickHouse client interface (minimal)
 */
export interface ClickHouseClient {
  query<T>(query: string, options?: QueryOptions): Promise<QueryResult<T>>;
  insert(table: string, data: Record<string, any>[]): Promise<void>;
}

export interface QueryOptions {
  params?: Record<string, any>;
  format?: string;
}

export interface QueryResult<T> {
  data: T[];
  rows: number;
  statistics?: {
    rows_read: number;
    bytes_read: number;
    elapsed: number;
  };
}

/**
 * Database routing metadata
 */
export interface DatabaseRouting {
  host: string;
  port: number;
  database: string;
  username: string;
  secretRef: string;
  region?: string;
}

/**
 * Tenancy-aware ClickHouse configuration
 */
export interface TenancyAwareClickHouseConfig {
  /** Tenant resolver */
  tenantResolver: TenantResolver;

  /** Bitwarden secrets client */
  bitwardenClient: BitwardenSecretsClient;

  /** Default ClickHouse configuration for shared database */
  defaultConfig: {
    host: string;
    port: number;
    username: string;
  };

  /** Connection pool for tenant databases */
  pool: ClickHousePool;
}

/**
 * ClickHouse connection pool for tenant databases
 */
export interface ClickHousePool {
  get(tenantId: string, config: DatabaseRouting): Promise<ClickHouseClient>;
  close(tenantId?: string): Promise<void>;
}

/**
 * Tenancy-aware ClickHouse resolver
 *
 * Resolves tenant-specific ClickHouse clients based on isolation strategy.
 *
 * Isolation strategies:
 * - **shared** (B2C): Single database with tenant_id filtering in queries
 * - **database** (B2B): Separate ClickHouse database per tenant
 * - **table** (mixed): Same database, separate tables per tenant
 */
export class TenancyAwareClickHouse {
  constructor(private config: TenancyAwareClickHouseConfig) { }

  /**
   * Resolve ClickHouse client for tenant
   *
   * @param tenantId - Tenant identifier
   * @returns Tenant-scoped ClickHouse client
   */
  async resolve(tenantId: string): Promise<ClickHouseClient> {
    const tenant = await this.config.tenantResolver.resolve(tenantId);

    switch (tenant.isolation.database) {
      case 'shared':
        return new SharedClickHouseClient({
          tenantId,
          ...this.config.defaultConfig,
        });

      case 'database':
        const routing = {
          host: tenant.database.host,
          port: tenant.database.port,
          database: tenant.database.name,
          username: tenant.database.user,
          secretRef: tenant.database.secretRef,
        };
        return this.config.pool.get(tenantId, routing);

      default:
        throw new Error(`Unsupported database isolation mode: ${tenant.isolation.database}`);
    }
  }
}

/**
 * Shared ClickHouse client with tenant filtering
 *
 * Wraps a shared ClickHouse database and automatically filters queries by tenant_id.
 * Used for shared database isolation strategy (B2C).
 */
class SharedClickHouseClient implements ClickHouseClient {
  constructor(
    private config: {
      tenantId: string;
      host: string;
      port: number;
      username: string;
    }
  ) { }

  async query<T>(query: string, options?: QueryOptions): Promise<QueryResult<T>> {
    // Inject tenant_id filter into WHERE clause
    const filteredQuery = this.injectTenantFilter(query);
    // TODO: Execute query on ClickHouse
    return { data: [], rows: 0 };
  }

  async insert(table: string, data: Record<string, any>[]): Promise<void> {
    // Automatically add tenant_id to data
    const enrichedData = data.map(row => ({
      ...row,
      tenant_id: this.config.tenantId,
    }));
    // TODO: Insert into ClickHouse
  }

  /**
   * Inject tenant_id filter into query
   */
  private injectTenantFilter(query: string): string {
    // Simple implementation - in production, use a SQL parser
    const lowerQuery = query.toLowerCase().trim();

    // If query already has tenant_id filter, don't add it
    if (lowerQuery.includes('tenant_id') || lowerQuery.includes('tenantid')) {
      return query;
    }

    // Add WHERE clause if not present
    if (lowerQuery.includes(' where ')) {
      return query.replace(/ where /i, ` WHERE tenant_id = '${this.config.tenantId}' AND `);
    }

    // Add WHERE clause
    return query.replace(/ from /i, (match) => {
      const tableName = this.extractTableName(query);
      if (tableName) {
        return ` FROM ${tableName} WHERE tenant_id = '${this.config.tenantId}'`;
      }
      return match;
    });
  }

  private extractTableName(query: string): string | null {
    // Simple table name extraction
    const match = query.match(/from\s+(\w+)/i);
    return match ? match[1] : null;
  }
}

/**
 * Dedicated ClickHouse client for tenant-specific database
 *
 * Uses tenant-specific ClickHouse database.
 * Used for dedicated database isolation strategy (B2B).
 */
class DedicatedClickHouseClient implements ClickHouseClient {
  constructor(
    private config: {
      tenantId: string;
      host: string;
      port: number;
      database: string;
      username: string;
      password: string;
    }
  ) { }

  async query<T>(query: string, options?: QueryOptions): Promise<QueryResult<T>> {
    // TODO: Execute query on tenant's ClickHouse database
    return { data: [], rows: 0 };
  }

  async insert(table: string, data: Record<string, any>[]): Promise<void> {
    // TODO: Insert into tenant's ClickHouse database
    // No tenant_id injection needed - database is isolated
  }
}

/**
 * Create a tenancy-aware ClickHouse resolver
 */
export function createTenancyAwareClickHouse(
  config: TenancyAwareClickHouseConfig
): TenancyAwareClickHouse {
  return new TenancyAwareClickHouse(config);
}
