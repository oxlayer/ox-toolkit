/**
 * Cache policies and strategies
 *
 * Defines common caching strategies and eviction policies.
 */

/**
 * TTL policies (time-to-live)
 */
export class TTLPolicy {
  /**
   * 5 seconds - Very short lived
   */
  static readonly VERY_SHORT = 5;

  /**
   * 30 seconds - Short lived
   */
  static readonly SHORT = 30;

  /**
   * 5 minutes - Medium lived
   */
  static readonly MEDIUM = 300;

  /**
   * 1 hour - Long lived
   */
  static readonly LONG = 3600;

  /**
   * 1 day - Very long lived
   */
  static readonly VERY_LONG = 86400;

  /**
   * 30 days - Extended
   */
  static readonly EXTENDED = 2592000;

  /**
   * Custom TTL
   */
  static of(seconds: number): number {
    return seconds;
  }
}

/**
 * Cache strategies
 */
export enum CacheStrategy {
  /**
   * Cache-aside: Lazy loading, cache miss loads from source
   */
  CACHE_ASIDE = 'cache-aside',

  /**
   * Write-through: Write to cache and source simultaneously
   */
  WRITE_THROUGH = 'write-through',

  /**
   * Write-back: Write to cache first, batch write to source
   */
  WRITE_BACK = 'write-back',

  /**
   * Refresh-ahead: Proactively refresh before expiry
   */
  REFRESH_AHEAD = 'refresh-ahead',
}

/**
 * Eviction policies
 */
export enum EvictionPolicy {
  /**
   * Least Recently Used - evict items not used for longest
   */
  LRU = 'lru',

  /**
   * Least Frequently Used - evict least accessed items
   */
  LFU = 'lfu',

  /**
   * First In First Out - evict oldest items
   */
  FIFO = 'fifo',

  /**
   * Time To Live - evict expired items
   */
  TTL = 'ttl',

  /**
   * Random - evict random items
   */
  RANDOM = 'random',

  /**
   * No eviction - fail when full
   */
  NONE = 'none',
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /**
   * Default TTL for cache entries
   */
  defaultTTL?: number;

  /**
   * Maximum number of entries
   */
  maxSize?: number;

  /**
   * Eviction policy
   */
  evictionPolicy?: EvictionPolicy;

  /**
   * Cache strategy
   */
  strategy?: CacheStrategy;

  /**
   * Namespace/prefix for keys
   */
  namespace?: string;

  /**
   * Whether to track statistics
   */
  trackStats?: boolean;

  /**
   * Enable refresh-ahead (proactively refresh before expiry)
   */
  refreshAhead?: boolean;

  /**
   * Refresh-ahead threshold (percentage of TTL)
   */
  refreshAheadThreshold?: number;
}

/**
 * Default cache configuration
 */
export const defaultCacheConfig: CacheConfig = {
  defaultTTL: TTLPolicy.MEDIUM,
  maxSize: 10000,
  evictionPolicy: EvictionPolicy.TTL,
  strategy: CacheStrategy.CACHE_ASIDE,
  trackStats: true,
};

/**
 * Cache warming options
 */
export interface CacheWarmupOptions<T> {
  /**
   * Keys to warm
   */
  keys: string[];

  /**
   * Factory function to load values
   */
  factory: (key: string) => T | Promise<T>;

  /**
   * TTL for warmed entries
   */
  ttl?: number;

  /**
   * Number of concurrent warmup operations
   */
  concurrency?: number;
}

/**
 * Cache invalidation options
 */
export interface CacheInvalidationOptions {
  /**
   * Pattern-based invalidation (e.g., "user:*")
   */
  pattern?: string;

  /**
   * Tag-based invalidation
   */
  tags?: string[];

  /**
   * Namespace to invalidate
   */
  namespace?: string;
}
