/**
 * Tenancy Capability - Isolation Strategies
 *
 * Defines resource-specific resolvers that provide tenant-isolated
 * database, storage, cache, and other resources.
 *
 * These resolvers are the application-facing API for tenancy.
 * Business logic calls these resolvers, never touching credentials
 * or connection details directly.
 */

import type { Cache, CacheResult } from "@oxlayer/capabilities-cache";
import type { TenantResolver } from "./resolver.js";

/**
 * Database resolver interface
 *
 * Provides tenant-isolated database connections.
 * The concrete database type is defined by the adapter implementation.
 *
 * @example
 * ```ts
 * const db = await tenancy.database.resolve('acme-corp');
 * // For B2B: returns dedicated database connection
 * // For B2C: returns shared connection with RLS context set
 * ```
 */
export interface DatabaseResolver<TDatabase> {
  /**
   * Resolve database for tenant
   *
   * Returns a database instance scoped to the tenant.
   * The instance type depends on the adapter implementation:
   * - Drizzle ORM: returns Database instance
   * - Prisma: returns PrismaClient
   * - MongoDB: returns MongoClient
   * - Native: returns Pool or Client
   *
   * @param tenantId - Tenant identifier
   * @returns Tenant-scoped database instance
   */
  resolve(tenantId: string): Promise<TDatabase>;
}

/**
 * Storage resolver interface
 *
 * Provides tenant-isolated storage clients.
 * The concrete storage type is defined by the adapter implementation.
 *
 * @example
 * ```ts
 * const storage = await tenancy.storage.resolve('acme-corp');
 * await storage.putObject({ Bucket: 'acme-corp-data', Key: 'file.pdf', Body: buffer });
 * ```
 */
export interface StorageResolver<TStorage> {
  /**
   * Resolve storage client for tenant
   *
   * Returns a storage client configured for the tenant.
   * The instance type depends on the adapter implementation:
   * - AWS S3: returns S3Client
   * - GCS: returns StorageClient
   * - Azure Blob: returns BlobServiceClient
   * - MinIO: returns MinIOClient
   *
   * @param tenantId - Tenant identifier
   * @returns Tenant-scoped storage client
   */
  resolve(tenantId: string): Promise<TStorage>;
}

/**
 * Cache resolver interface
 *
 * Provides tenant-isolated cache operations.
 * The concrete cache type is defined by the adapter implementation.
 *
 * @example
 * ```ts
 * const cache = await tenancy.cache.resolve('acme-corp');
 * await cache.set('user:123', userData);
 * // For shared cache: stores as "acme-corp:user:123"
 * // For dedicated cache: stores as "user:123" in tenant's Redis
 * ```
 */
export interface CacheResolver<TCache = Cache> {
  /**
   * Resolve cache for tenant
   *
   * Returns a cache instance scoped to the tenant.
   * The instance type depends on the adapter implementation:
   * - Redis: returns Redis client
   * - Memcached: returns Memcached client
   * - In-memory: returns Map-based cache
   *
   * @param tenantId - Tenant identifier
   * @returns Tenant-scoped cache instance
   */
  resolve(tenantId: string): Promise<TCache>;
}

/**
 * Tenancy-aware cache wrapper
 *
 * Wraps a base cache with automatic tenant key prefixing.
 * Used for shared cache isolation strategy.
 */
export class TenantScopedCache implements Cache {
  constructor(
    private baseCache: Cache,
    private tenantId: string
  ) { }

  private prefixKey(key: string): string {
    return `${this.tenantId}:${key}`;
  }

  async get<T>(key: string): Promise<CacheResult<T>> {
    return this.baseCache.get<T>(this.prefixKey(key));
  }

  async set<T>(key: string, value: T, options?: { ttl?: number }): Promise<void> {
    return this.baseCache.set(this.prefixKey(key), value, options);
  }

  async del(key: string): Promise<boolean> {
    return this.baseCache.del(this.prefixKey(key));
  }

  async delMany(keys: string[]): Promise<number> {
    return this.baseCache.delMany(keys.map(k => this.prefixKey(k)));
  }

  async has(key: string): Promise<boolean> {
    return this.baseCache.has(this.prefixKey(key));
  }

  async clear(): Promise<void> {
    // Clear only this tenant's keys
    // Implementation depends on cache backend capabilities
    // For Redis: scan and del with pattern match
    throw new Error("Tenant-scoped clear not implemented");
  }

  async getStats() {
    return this.baseCache.getStats();
  }

  async resetStats(): Promise<void> {
    return this.baseCache.resetStats();
  }

  async getMany<T>(keys: string[]): Promise<Map<string, CacheResult<T>>> {
    const prefixedKeys = keys.map(k => this.prefixKey(k));
    return this.baseCache.getMany<T>(prefixedKeys);
  }

  async setMany<T>(entries: Map<string, T>, options?: { ttl?: number }): Promise<void> {
    const prefixedEntries = new Map(
      [...entries].map(([k, v]) => [this.prefixKey(k), v])
    );
    return this.baseCache.setMany(prefixedEntries, options);
  }

  async incr(key: string, delta?: number): Promise<number> {
    return this.baseCache.incr(this.prefixKey(key), delta);
  }

  async decr(key: string, delta?: number): Promise<number> {
    return this.baseCache.decr(this.prefixKey(key), delta);
  }

  async getOrSet<T>(
    key: string,
    factory: () => T | Promise<T>,
    options?: { ttl?: number }
  ): Promise<T> {
    return this.baseCache.getOrSet(this.prefixKey(key), factory, options);
  }

  async setex<T>(key: string, value: T, ttl: number): Promise<void> {
    return this.baseCache.setex(this.prefixKey(key), value, ttl);
  }

  async setNX<T>(key: string, value: T, options?: { ttl?: number }): Promise<boolean> {
    return this.baseCache.setNX(this.prefixKey(key), value, options);
  }

  async getAndDel<T>(key: string): Promise<T | null> {
    return this.baseCache.getAndDel(this.prefixKey(key));
  }

  async ttl(key: string): Promise<number> {
    return this.baseCache.ttl(this.prefixKey(key));
  }
}

/**
 * Main tenancy capability interface
 *
 * Aggregates all tenant resource resolvers into a single interface.
 * This is the primary API for application code.
 *
 * @example
 * ```ts
 * import { tenancy } from '@oxlayer/pro-tenancy';
 *
 * // In request handler
 * const db = await tenancy.database.resolve(ctx.tenantId);
 * const cache = await tenancy.cache?.resolve(ctx.tenantId);
 *
 * // Business logic is tenant-agnostic
 * const user = await repo.findById(userId); // repo uses tenant-scoped db
 * ```
 */
export interface Tenancy<TDatabase, TStorage = unknown, TCache = Cache> {
  /** Tenant configuration resolver */
  readonly resolver: TenantResolver;

  /** Database resource resolver (required) */
  readonly database: DatabaseResolver<TDatabase>;

  /** Storage resource resolver (optional) */
  readonly storage?: StorageResolver<TStorage>;

  /** Cache resource resolver (optional) */
  readonly cache?: CacheResolver<TCache>;
}

/**
 * Create a tenancy instance
 *
 * Factory function for creating a Tenancy instance with validation and defaults.
 * Centralizes tenancy setup and ensures all required resolvers are provided.
 *
 * @example
 * ```ts
 * import { createTenancy } from '@oxlayer/pro-tenancy';
 * import { PostgresDatabaseResolver } from '@oxlayer/postgres-tenancy';
 * import { S3StorageResolver } from '@oxlayer/s3-tenancy';
 * import { RedisCacheResolver } from '@oxlayer/redis-tenancy';
 *
 * const tenancy = createTenancy({
 *   resolver: tenantResolver,
 *   database: new PostgresDatabaseResolver(config),
 *   storage: new S3StorageResolver(config),
 *   cache: new RedisCacheResolver(config),
 * });
 * ```
 */
export function createTenancy<
  TDatabase,
  TStorage = unknown,
  TCache = Cache
>(options: {
  /** Tenant configuration resolver */
  resolver: TenantResolver;

  /** Database resource resolver */
  database: DatabaseResolver<TDatabase>;

  /** Storage resource resolver */
  storage?: StorageResolver<TStorage>;

  /** Cache resource resolver */
  cache?: CacheResolver<TCache>;
}): Tenancy<TDatabase, TStorage, TCache> {
  // Validate required options
  if (!options.resolver) {
    throw new Error('TenantResolver is required');
  }
  if (!options.database) {
    throw new Error('DatabaseResolver is required');
  }

  // Return validated tenancy instance
  return {
    resolver: options.resolver,
    database: options.database,
    storage: options.storage,
    cache: options.cache,
  };
}

/**
 * Tenant context from JWT/auth
 *
 * Extracted from authentication token and attached to request context.
 */
export interface TenantContext {
  /** Tenant identifier */
  tenantId: string;

  /** User identifier */
  userId: string;

  /** User roles */
  roles: string[];

  /** User email (optional) */
  email?: string;
}
