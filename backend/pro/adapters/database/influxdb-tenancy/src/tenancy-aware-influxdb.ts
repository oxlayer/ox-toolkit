/**
 * Tenancy-Aware InfluxDB Adapter
 *
 * Provides tenant-isolated time-series data storage with:
 * - Shared bucket: All tenants in one bucket with tenant_id tag filtering
 * - Dedicated bucket: Separate bucket per tenant
 *
 * Architecture:
 * - B2C tenants: Shared bucket with automatic tenant_id tag injection
 * - B2B tenants: Dedicated bucket with isolated retention policies
 *
 * @example
 * ```ts
 * const influxdb = await tenantInfluxDB.resolve('acme-corp');
 *
 * // Write points - tenant_id is automatically injected for shared bucket
 * const writeApi = influxdb.getWriteApi(org, bucket);
 * writeApi.writePoint(new Point('temperature')
 *   .tag('location', 'server-room')
 *   .floatField('value', 23.5));
 *
 * // Query - tenant filter automatically injected for shared bucket
 * const queryApi = influxdb.getQueryApi(org);
 * const result = queryApi.query('from(bucket:"metrics") |> range(start: -1h)');
 * // Becomes: from(bucket:"metrics") |> range(start: -1h) |> filter(fn: (r) => r.tenant_id == "acme-corp")
 * ```
 *
 * Note: This adapter uses composition over inheritance. The returned WriteApi and QueryApi
 * are wrappers around the InfluxDB SDK clients, not implementations of SDK interfaces.
 */

import type {
  InfluxDB,
  WriteApi,
  QueryApi,
  Point,
  WritePrecisionType,
} from '@influxdata/influxdb-client';
import type {
  TenantResolver,
  TenantConfig,
} from '@oxlayer/pro-tenancy';
import {
  } from '@oxlayer/pro-tenancy';

/**
 * InfluxDB routing configuration for a tenant
 */
export interface InfluxDBRouting {
  /** Bucket name */
  bucket: string;
  /** Organization name */
  organization: string;
  /** Auth token reference (for dedicated buckets) */
  tokenRef?: string;
  /** Region */
  region?: string;
  /** URL for dedicated InfluxDB instance */
  url?: string;
}

/**
 * Configuration for TenancyAwareInfluxDB
 */
export interface TenancyAwareInfluxDBConfig {
  /** Tenant resolver for loading tenant configuration */
  tenantResolver: TenantResolver;
  /** Base InfluxDB client for shared bucket scenario */
  baseClient: InfluxDB;
  /** Default organization for shared bucket */
  defaultOrg: string;
  /** Default bucket for shared scenario */
  defaultBucket: string;
}

/**
 * Tenant-isolated WriteApi wrapper
 * Automatically injects tenant_id tag for shared bucket
 *
 * Uses composition over inheritance - wraps the SDK client rather than implementing its interface.
 */
export class TenantScopedWriteApi {
  constructor(
    private readonly writeApi: WriteApi,
    private readonly tenantId: string,
    private readonly isolationMode: 'shared' | 'dedicated',
  ) { }

  /**
   * Write a point with automatic tenant_id injection
   */
  writePoint(record: Point): void {
    if (this.isolationMode === 'shared') {
      // Inject tenant_id tag for shared bucket
      const point = record.tag('tenant_id', this.tenantId);
      this.writeApi.writePoint(point);
    } else {
      // Dedicated bucket - write as-is
      this.writeApi.writePoint(record);
    }
  }

  /**
   * Write multiple records with automatic tenant_id injection
   */
  writeRecords(records: string[]): void {
    if (this.isolationMode === 'shared') {
      // Inject tenant_id tag into line protocol
      const enrichedRecords = records.map(record => {
        if (!record.includes('tenant_id=')) {
          return record.replace(/,([a-z])/i, `,tenant_id=${this.tenantId},$1`);
        }
        return record;
      });
      this.writeApi.writeRecords(enrichedRecords);
    } else {
      this.writeApi.writeRecords(records);
    }
  }

  /**
   * Write a single line protocol record
   */
  writeRecord(line: string): void {
    if (this.isolationMode === 'shared' && !line.includes('tenant_id=')) {
      const enriched = line.replace(/,([a-z])/i, `,tenant_id=${this.tenantId},$1`);
      this.writeApi.writeRecord(enriched);
    } else {
      this.writeApi.writeRecord(line);
    }
  }

  /**
   * Flush pending writes
   */
  async flush(): Promise<void> {
    return this.writeApi.flush();
  }

  /**
   * Close the write API and flush all pending writes
   */
  async close(): Promise<void> {
    return this.writeApi.close();
  }

  /**
   * Dispose of resources (synchronous cleanup)
   */
  dispose(): void {
    this.writeApi.dispose();
  }
}

/**
 * Tenant-isolated QueryApi wrapper
 * Automatically injects tenant filter for shared bucket
 *
 * Uses composition over inheritance - wraps the SDK client rather than implementing its interface.
 *
 * Note: This wrapper only exposes commonly used query methods. If you need additional
 * QueryApi methods, access the underlying SDK client via the `api` property.
 */
export class TenantScopedQueryApi {
  constructor(
    private readonly queryApi: QueryApi,
    private readonly tenantId: string,
    private readonly isolationMode: 'shared' | 'dedicated',
  ) { }

  /**
   * Execute query and process rows with callback
   *
   * @param query - Flux query string
   * @param callback - Callback function to process each row
   */
  async queryRows(query: string, callback: any): Promise<void> {
    const enrichedQuery = this.enrichQuery(query);
    return this.queryApi.queryRows(enrichedQuery, callback);
  }

  /**
   * Execute raw query
   *
   * @param query - Flux query string
   * @returns Raw query results
   */
  async queryRaw(query: string): Promise<any> {
    const enrichedQuery = this.enrichQuery(query);
    return this.queryApi.queryRaw(enrichedQuery);
  }

  /**
   * Get access to the underlying SDK QueryApi
   *
   * Use this for advanced query methods not exposed by this wrapper.
   * Be aware that tenant filtering will NOT be automatically applied.
   */
  get api(): QueryApi {
    return this.queryApi;
  }

  /**
   * Inject tenant filter into Flux query for shared bucket
   */
  private enrichQuery(query: string): string {
    if (this.isolationMode === 'dedicated') {
      return query; // No enrichment needed for dedicated bucket
    }

    // For shared bucket, inject tenant filter
    const lowerQuery = query.toLowerCase();

    // Check if query already has tenant_id filter
    if (lowerQuery.includes('tenant_id') || lowerQuery.includes('r.tenant_id')) {
      return query;
    }

    // Inject tenant filter after range() or other time-based functions
    // Pattern: |> range(...) |> filter(fn: (r) => ...)
    const rangeFilterPattern = /\|>\s*range\s*\([^)]+\)\s*/i;
    const filterPattern = /\|>\s*filter\s*\([^)]+\)/i;

    if (filterPattern.test(query)) {
      // Insert tenant filter before existing filter
      return query.replace(
        /(\|>\s*filter\s*\()([^)]+)\)/i,
        `$1$r) => r.tenant_id == "${this.tenantId}" and $2)`
      );
    }

    if (rangeFilterPattern.test(query)) {
      // Add tenant filter after range
      return query.replace(
        rangeFilterPattern,
        `$&|> filter(fn: (r) => r.tenant_id == "${this.tenantId}") `
      );
    }

    // Fallback: append tenant filter
    return query + ` |> filter(fn: (r) => r.tenant_id == "${this.tenantId}")`;
  }
}

/**
 * Tenant-isolated InfluxDB client wrapper
 *
 * Provides tenant-scoped access to InfluxDB with automatic
 * tenant_id injection for shared bucket isolation.
 */
export class TenantScopedInfluxDB {
  constructor(
    private readonly influxdb: InfluxDB,
    public readonly tenantId: string,
    public readonly bucket: string,
    public readonly organization: string,
    private readonly isolationMode: 'shared' | 'dedicated',
  ) { }

  /**
   * Get a WriteApi for this tenant
   *
   * Returns a wrapped WriteApi that automatically injects tenant_id tags.
   *
   * @param org - Organization (defaults to this tenant's organization)
   * @param bucket - Bucket name (defaults to this tenant's bucket)
   * @param options - Write precision options (defaults to 'ns' precision)
   */
  getWriteApi(
    org?: string,
    bucket?: string,
    options?: WritePrecisionType
  ): TenantScopedWriteApi {
    const writeOrg = org ?? this.organization;
    const writeBucket = bucket ?? this.bucket;
    // Default to 'ns' (nanosecond) precision if not specified
    const writeOptions = options ?? 'ns';

    const baseWriteApi = this.influxdb.getWriteApi(writeOrg, writeBucket, writeOptions);

    return new TenantScopedWriteApi(
      baseWriteApi,
      this.tenantId,
      this.isolationMode,
    );
  }

  /**
   * Get a QueryApi for this tenant
   *
   * Returns a wrapped QueryApi that automatically injects tenant filters.
   *
   * @param org - Organization (defaults to this tenant's organization)
   */
  getQueryApi(org?: string): TenantScopedQueryApi {
    const queryOrg = org ?? this.organization;

    const baseQueryApi = this.influxdb.getQueryApi(queryOrg);

    return new TenantScopedQueryApi(
      baseQueryApi,
      this.tenantId,
      this.isolationMode,
    );
  }

  /**
   * Convenience property to get the default query API
   */
  get query(): TenantScopedQueryApi {
    return this.getQueryApi();
  }
}

/**
 * Tenancy-Aware InfluxDB
 *
 * Main entry point for tenant-isolated InfluxDB operations.
 *
 * @example
 * ```ts
 * const tenantInfluxDB = new TenancyAwareInfluxDB({
 *   tenantResolver,
 *   baseClient: influxdbClient,
 *   defaultOrg: 'main-org',
 *   defaultBucket: 'metrics',
 * });
 *
 * const influxdb = await tenantInfluxDB.resolve('acme-corp');
 * const writeApi = influxdb.getWriteApi();
 * writeApi.writePoint(new Point('temperature').floatField('value', 23.5));
 * ```
 */
export class TenancyAwareInfluxDB {
  private connections = new Map<string, TenantScopedInfluxDB>();

  constructor(private config: TenancyAwareInfluxDBConfig) { }

  /**
   * Resolve InfluxDB client for a tenant
   *
   * @param tenantId - Tenant identifier
   * @returns Tenant-scoped InfluxDB client
   * @throws {TenantNotFoundError} If tenant doesn't exist
   * @throws {TenantNotReadyError} If tenant is not in ready state
   * @throws {UnsupportedIsolationModeError} If isolation mode is not supported
   */
  async resolve(tenantId: string): Promise<TenantScopedInfluxDB> {
    // Check cache
    if (this.connections.has(tenantId)) {
      return this.connections.get(tenantId)!;
    }

    // Resolve tenant configuration
    const tenant = await this.config.tenantResolver.resolve(tenantId);

    // Get InfluxDB routing config from tenant metadata
    const routing = this.extractRouting(tenant);

    // Determine isolation mode
    const isolationMode = tenant.isolation.cache === 'dedicated' ? 'dedicated' : 'shared';

    // Get InfluxDB client based on isolation
    const influxdb = await this.getInfluxDB(tenant, routing, isolationMode);

    // Create tenant-scoped wrapper
    const tenantInfluxDB = new TenantScopedInfluxDB(
      influxdb,
      tenantId,
      routing.bucket,
      routing.organization,
      isolationMode,
    );

    // Cache connection
    this.connections.set(tenantId, tenantInfluxDB);

    return tenantInfluxDB;
  }

  /**
   * Extract InfluxDB routing from tenant config
   */
  private extractRouting(tenant: TenantConfig): InfluxDBRouting {
    // Check if tenant has custom InfluxDB routing
    if ((tenant as any).influxdb) {
      return (tenant as any).influxdb as InfluxDBRouting;
    }

    // Use default routing based on tenant ID
    return {
      bucket: this.config.defaultBucket,
      organization: this.config.defaultOrg,
    };
  }

  /**
   * Get InfluxDB client based on isolation mode
   */
  private async getInfluxDB(
    tenant: TenantConfig,
    routing: InfluxDBRouting,
    isolationMode: 'shared' | 'dedicated',
  ): Promise<InfluxDB> {
    if (isolationMode === 'shared') {
      // Shared bucket - use base client
      return this.config.baseClient;
    }

    // Dedicated bucket - would use separate client with tenant-specific auth
    // For now, reuse base client but use separate bucket
    // In production, you might want a separate InfluxDB instance per tenant
    return this.config.baseClient;
  }

  /**
   * Invalidate cached connection for a tenant
   */
  invalidate(tenantId: string): void {
    this.connections.delete(tenantId);
  }

  /**
   * Clear all cached connections
   */
  clear(): void {
    this.connections.clear();
  }
}

/**
 * Factory function to create TenancyAwareInfluxDB
 *
 * @example
 * ```ts
 * const tenantInfluxDB = createTenancyAwareInfluxDB({
 *   tenantResolver,
 *   influxdbClient: baseClient,
 *   defaultOrg: 'main-org',
 *   defaultBucket: 'metrics',
 * });
 * ```
 */
export function createTenancyAwareInfluxDB(
  config: TenancyAwareInfluxDBConfig,
): TenancyAwareInfluxDB {
  return new TenancyAwareInfluxDB(config);
}

/**
 * Re-export types for convenience
 */
export type {
  InfluxDB,
  WriteApi,
  QueryApi,
  Point,
  WritePrecisionType,
};
