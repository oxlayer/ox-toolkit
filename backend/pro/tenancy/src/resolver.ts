/**
 * Tenancy Capability - Tenant Resolver Interface
 *
 * Defines the contract for resolving tenant configuration from the control plane.
 * Implementations can use different data sources (database, cache, API, etc.).
 */

import type { TenantConfig, CachedValue } from "./types.js";
import { DEFAULT_CACHE_CONFIG } from "./types.js";
import {
  TenantNotFoundError,
  TenantNotReadyError,
  TenantDisabledError,
  CacheExpiredError,
} from "./errors.js";

/**
 * Time utility
 */
function now(): number {
  return Date.now();
}

/**
 * Check if cached value has expired
 */
function isExpired<T>(cached: CachedValue<T>): boolean {
  return cached.expiresAt <= now();
}

/**
 * Tenant resolver interface
 *
 * Defines the contract for resolving tenant configuration.
 * Implementations MUST cache resolved configs for performance.
 *
 * @example
 * ```ts
 * const resolver = new DatabaseTenantResolver(controlDb);
 * const tenant = await resolver.resolve('acme-corp');
 * console.log(tenant.isolation.database); // "database"
 * ```
 */
export interface TenantResolver {
  /**
   * Resolve tenant configuration
   *
   * Returns cached config if available and fresh, otherwise loads from source.
   * Throws TenantNotFoundError if tenant doesn't exist.
   * Throws TenantNotReadyError if tenant is in non-operational state.
   *
   * @param tenantId - Unique tenant identifier
   * @returns Tenant configuration
   */
  resolve(tenantId: string): Promise<TenantConfig>;

  /**
   * Invalidate cached configuration for a specific tenant
   *
   * Forces next resolve() to reload from source.
   * Use after tenant provisioning, migration, or config updates.
   *
   * @param tenantId - Tenant to invalidate
   */
  invalidate(tenantId: string): void;

  /**
   * Clear all cached configurations
   *
   * Clears entire cache. Use sparingly (e.g., after bulk migrations).
   */
  clear(): void;

  /**
   * Get cache statistics (optional)
   *
   * Returns current cache size and hit/miss metrics if tracked.
   */
  getStats?(): CacheStats;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Number of tenants currently cached */
  size: number;

  /** Total cache hits since start */
  hits: number;

  /** Total cache misses since start */
  misses: number;

  /** Cache hit ratio (0-1) */
  hitRatio: number;
}

/**
 * In-memory tenant resolver implementation
 *
 * Basic implementation that loads tenant config once and caches it.
 * Useful for testing and simple deployments.
 *
 * For production, use DatabaseTenantResolver which loads from
 * the control plane database and caches with TTL.
 */
export class InMemoryTenantResolver implements TenantResolver {
  private cache = new Map<string, CachedValue<TenantConfig>>();
  private hits = 0;
  private misses = 0;

  constructor(
    private tenants: Map<string, TenantConfig>,
    private ttlMs: number = DEFAULT_CACHE_CONFIG.tenantConfigTtl
  ) {}

  async resolve(tenantId: string): Promise<TenantConfig> {
    const cached = this.cache.get(tenantId);

    if (cached && !isExpired(cached)) {
      this.hits++;
      return cached.value;
    }

    this.misses++;
    const tenant = this.tenants.get(tenantId);

    if (!tenant) {
      throw new TenantNotFoundError(tenantId);
    }

    if (tenant.state !== "ready") {
      throw new TenantNotReadyError(tenantId, tenant.state);
    }

    // Cache with TTL
    this.cache.set(tenantId, {
      value: tenant,
      expiresAt: now() + this.ttlMs,
    });

    return tenant;
  }

  invalidate(tenantId: string): void {
    this.cache.delete(tenantId);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio: total > 0 ? this.hits / total : 0,
    };
  }
}

/**
 * Cached tenant resolver base class
 *
 * Provides common caching logic for resolver implementations.
 * Subclasses implement the load() method to fetch from their data source.
 *
 * @example
 * ```ts
 * class DatabaseTenantResolver extends CachedTenantResolver {
 *   constructor(private db: Database) {
 *     super();
 *   }
 *
 *   protected async load(tenantId: string): Promise<TenantConfig> {
 *     const [row] = await this.db.select().from(tenants)
 *       .where(eq(tenants.tenantId, tenantId));
 *     if (!row) throw new TenantNotFoundError(tenantId);
 *     return mapToTenantConfig(row);
 *   }
 * }
 * ```
 */
export abstract class CachedTenantResolver implements TenantResolver {
  protected cache = new Map<string, CachedValue<TenantConfig>>();
  protected hits = 0;
  protected misses = 0;
  protected readonly ttlMs: number;

  constructor(ttlMs: number = DEFAULT_CACHE_CONFIG.tenantConfigTtl) {
    this.ttlMs = ttlMs;
  }

  async resolve(tenantId: string): Promise<TenantConfig> {
    const cached = this.cache.get(tenantId);

    if (cached && !isExpired(cached)) {
      this.hits++;
      return cached.value;
    }

    this.misses++;
    const tenant = await this.load(tenantId);

    // Validate tenant state
    if (tenant.state !== "ready") {
      if (tenant.state === "disabled") {
        throw new TenantDisabledError(tenantId);
      }
      throw new TenantNotReadyError(tenantId, tenant.state);
    }

    // Cache with TTL
    this.cache.set(tenantId, {
      value: tenant,
      expiresAt: now() + this.ttlMs,
    });

    return tenant;
  }

  invalidate(tenantId: string): void {
    this.cache.delete(tenantId);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Load tenant configuration from data source
   *
   * Subclasses implement this to fetch from their specific source.
   * Called only on cache miss.
   *
   * @param tenantId - Tenant identifier to load
   * @returns Tenant configuration
   * @throws TenantNotFoundError if tenant doesn't exist
   */
  protected abstract load(tenantId: string): Promise<TenantConfig>;
}
