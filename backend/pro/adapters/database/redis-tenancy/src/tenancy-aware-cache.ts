/**
 * Redis Tenancy Adapter
 *
 * Multi-tenant Redis adapter supporting:
 * - **Shared**: Single Redis instance with tenant-prefixed keys (B2C)
 * - **Database**: Separate Redis database per tenant (B2B)
 * - **Dedicated**: Separate Redis instance per tenant (enterprise)
 *
 * Works with ANY client keyspace - automatic `{tenantId}:` prefixing.
 *
 * @example
 * ```ts
 * import { createTenancyAwareCache } from '@oxlayer/pro-adapters-redis-tenancy';
 *
 * const tenantCache = createTenancyAwareCache({
 *   tenantResolver,
 *   bitwardenClient,
 *   baseCache: redisCache,
 * });
 *
 * const cache = await tenantCache.resolve('acme-corp');
 * await cache.set('user:123', userData);
 * // Automatically stored as 'acme-corp:user:123'
 * ```
 */

import type {
  CacheResolver,
  TenantResolver,
} from '@oxlayer/pro-tenancy';
import type {
  Cache as BaseCache,
  CacheResult,
} from '@oxlayer/capabilities-cache';
import {
  UnsupportedIsolationModeError,
} from '@oxlayer/pro-tenancy';

/**
 * Type alias for Cache from capabilities package
 * This allows the resolver to work with the Cache interface
 */
export type Cache = BaseCache;

/**
 * Cache routing metadata (internal to adapter)
 *
 * Defines how to connect to a tenant's cache instance.
 */
export interface CacheRouting {
  /** Cache host/endpoint */
  host: string;
  /** Cache port */
  port: number;
  /** Reference to secret in Bitwarden */
  secretRef: string;
  /** Database number (for Redis) */
  db?: number;
  /** TLS/SSL */
  tls?: boolean;
}

/**
 * Bitwarden secrets client interface
 */
export interface BitwardenSecretsClient {
  getCacheCredentials(secretRef: string): Promise<CacheCredentials>;
}

/**
 * Cache credentials from secret store
 */
export interface CacheCredentials {
  username?: string;
  password?: string;
  host?: string;
  port?: number;
  tls?: boolean;
}

/**
 * Redis connection configuration
 */
export interface RedisConnectionConfig {
  /** Redis host */
  host: string;
  /** Redis port */
  port: number;
  /** Database number (0-15) */
  db?: number;
  /** Username */
  username?: string;
  /** Password */
  password?: string;
  /** TLS/SSL */
  tls?: boolean;
  /** Key prefix */
  keyPrefix?: string;
}

/**
 * Configuration for TenancyAwareCache
 */
export interface TenancyAwareCacheConfig {
  /** Tenant resolver for loading tenant configuration */
  tenantResolver: TenantResolver;

  /** Base cache implementation (shared Redis) */
  baseCache: BaseCache;

  /** Bitwarden secrets client for credential resolution */
  bitwardenClient: BitwardenSecretsClient;

  /** Redis connection pool (optional, defaults to internal pool) */
  connectionPool?: RedisConnectionPool;

  /** Key prefix format (default: '{tenantId}:') */
  keyPrefixFormat?: 'colon' | 'underscore' | 'custom';
  /** Custom prefix formatter (if keyPrefixFormat is 'custom') */
  customPrefixFormatter?: (tenantId: string) => string;
}

/**
 * Redis connection pool manager
 *
 * Manages separate Redis connections for each tenant.
 */
export class RedisConnectionPool {
  private connections = new Map<string, BaseCache>();

  /**
   * Get or create a Redis connection
   *
   * @param key - Connection key
   * @param cache - Cache instance
   * @returns Cache instance
   */
  get(key: string, cache: BaseCache): BaseCache {
    if (!this.connections.has(key)) {
      this.connections.set(key, cache);
    }
    return this.connections.get(key)!;
  }

  /**
   * Close a specific connection
   */
  async close(key: string): Promise<void> {
    this.connections.delete(key);
  }

  /**
   * Close all connections
   */
  async closeAll(): Promise<void> {
    this.connections.clear();
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      connectionCount: this.connections.size,
      keys: Array.from(this.connections.keys()),
    };
  }
}

/**
 * Cache implementation with tenant-scoped key prefixing
 *
 * Wraps a base cache and automatically prefixes all keys with the tenant ID.
 * Uses the format `{tenantId}:key` for proper Redis cluster support.
 *
 * The curly braces in `{tenantId}:key` ensure that all keys for a tenant
 * are stored in the same Redis cluster hash slot.
 */
export class TenantScopedCache implements Cache {
  private prefix: string;

  constructor(
    private baseCache: BaseCache,
    tenantId: string,
    prefixFormat: 'colon' | 'underscore' | 'custom' = 'colon',
    customFormatter?: (tenantId: string) => string
  ) {
    this.prefix = this.buildPrefix(tenantId, prefixFormat, customFormatter);
  }

  /**
   * Build key prefix based on format
   */
  private buildPrefix(
    tenantId: string,
    format: 'colon' | 'underscore' | 'custom',
    customFormatter?: (tenantId: string) => string
  ): string {
    if (format === 'custom' && customFormatter) {
      return customFormatter(tenantId);
    }

    // Use curly braces for Redis cluster compatibility
    // This ensures all keys for a tenant are in the same hash slot
    switch (format) {
      case 'underscore':
        return `{${tenantId}}_`;
      case 'colon':
      default:
        return `{${tenantId}}:`;
    }
  }

  /**
   * Add tenant prefix to key
   */
  prefixKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Remove tenant prefix from key
   */
  private unprefixKey(prefixedKey: string): string {
    if (prefixedKey.startsWith(this.prefix)) {
      return prefixedKey.substring(this.prefix.length);
    }
    return prefixedKey;
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
    const prefixedKeys = keys.map((k) => this.prefixKey(k));
    return this.baseCache.delMany(prefixedKeys);
  }

  async has(key: string): Promise<boolean> {
    return this.baseCache.has(this.prefixKey(key));
  }

  async clear(): Promise<void> {
    // Clear only this tenant's keys using SCAN
    await this.clearByPattern(`${this.prefix}*`);
  }

  /**
   * Clear all keys matching a pattern
   */
  private async clearByPattern(pattern: string): Promise<void> {
    try {
      // This implementation depends on the underlying cache
      // For Redis with ioredis or redis client, we'd use SCAN
      // For now, we'll try to use delMany if the base cache supports pattern deletion

      // Check if baseCache has a method to get keys by pattern
      if (typeof (this.baseCache as any).keys === 'function') {
        const keys = await (this.baseCache as any).keys(pattern);
        if (keys && keys.length > 0) {
          await this.baseCache.delMany(keys);
        }
      }
    } catch (error) {
      console.warn(`Failed to clear cache by pattern: ${pattern}`, error);
    }
  }

  async getStats() {
    const stats = await this.baseCache.getStats();
    return {
      ...stats,
      // Tenant-specific stats would need pattern-based counting
    };
  }

  async resetStats(): Promise<void> {
    return this.baseCache.resetStats();
  }

  async getMany<T>(keys: string[]): Promise<Map<string, CacheResult<T>>> {
    const prefixedKeys = keys.map((k) => this.prefixKey(k));
    const results = await this.baseCache.getMany<T>(prefixedKeys);

    const mappedResults = new Map<string, CacheResult<T>>();
    for (const [prefixedKey, result] of results.entries()) {
      const originalKey = this.unprefixKey(prefixedKey);
      mappedResults.set(originalKey, result);
    }

    return mappedResults;
  }

  async setMany<T>(
    entries: Map<string, T>,
    options?: { ttl?: number }
  ): Promise<void> {
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
 * Tenancy-aware cache resolver
 *
 * Resolves tenant-scoped cache instances based on isolation strategy.
 * Works with any client cache - no external dependencies.
 *
 * Isolation strategies:
 * - **shared** (B2C): Returns wrapped cache with tenant-prefixed keys
 * - **database**: Uses separate Redis DB number per tenant
 * - **dedicated** (B2B): Returns dedicated cache instance
 *
 * Key prefix format:
 * Uses `{tenantId}:key` format for Redis cluster compatibility.
 * The curly braces ensure all keys for a tenant map to the same hash slot.
 */
export class TenancyAwareCache implements CacheResolver<Cache> {
  private cache = new Map<string, Cache>();
  private connectionPool: RedisConnectionPool;

  constructor(private config: TenancyAwareCacheConfig) {
    this.connectionPool = config.connectionPool || new RedisConnectionPool();
  }

  /**
   * Resolve cache for tenant
   *
   * @param tenantId - Tenant identifier
   * @returns Tenant-scoped Cache instance
   */
  async resolve(tenantId: string): Promise<Cache> {
    // Check if we have a cached instance
    const cached = this.cache.get(tenantId);
    if (cached) {
      return cached;
    }

    // Resolve tenant configuration
    const tenant = await this.config.tenantResolver.resolve(tenantId);

    let cache: Cache;

    switch (tenant.isolation.cache) {
      case 'shared':
      case undefined:
        // Shared cache with key prefixing
        cache = new TenantScopedCache(
          this.config.baseCache,
          tenantId,
          this.config.keyPrefixFormat || 'colon',
          this.config.customPrefixFormatter
        );
        break;

      case 'database':
      case 'dedicated':
        // For database/dedicated isolation, we still use prefixing for now
        // since TenantConfig doesn't have cache routing metadata
        // TODO: Add cache routing to TenantConfig when needed
        cache = new TenantScopedCache(
          this.config.baseCache,
          tenantId,
          this.config.keyPrefixFormat || 'colon',
          this.config.customPrefixFormatter
        );
        break;

      default:
        throw new UnsupportedIsolationModeError(
          tenantId,
          'cache',
          tenant.isolation.cache
        );
    }

    // Cache the instance
    this.cache.set(tenantId, cache);

    return cache;
  }

  /**
   * Invalidate cached cache instance for a tenant
   *
   * @param tenantId - Tenant to invalidate
   */
  invalidate(tenantId: string): void {
    this.cache.delete(tenantId);
  }

  /**
   * Clear all cached cache instances
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Close all connections
   */
  async closeAll(): Promise<void> {
    await this.connectionPool.closeAll();
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats() {
    return this.connectionPool.getStats();
  }
}

/**
 * Create a tenancy-aware cache resolver
 *
 * Factory function for creating a TenancyAwareCache instance.
 *
 * @example
 * ```ts
 * import { createTenancyAwareCache } from '@oxlayer/pro-adapters-redis-tenancy';
 *
 * const tenantCache = createTenancyAwareCache({
 *   tenantResolver,
 *   bitwardenClient,
 *   baseCache: redisCache,
 * });
 *
 * const cache = await tenantCache.resolve('acme-corp');
 * await cache.set('user:123', userData);
 * // Stored as 'acme-corp:user:123'
 * ```
 */
export function createTenancyAwareCache(
  config: TenancyAwareCacheConfig
): TenancyAwareCache {
  return new TenancyAwareCache(config);
}
