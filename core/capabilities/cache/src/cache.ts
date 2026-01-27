/**
 * Cache capability - defines cache semantics and interfaces
 *
 * This is the WHAT (capability): cache behavior, TTL, eviction, consistency
 * Adapters implement the HOW (Redis, Memcached, in-memory)
 */

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T> {
  /**
   * Cached value
   */
  value: T;
  /**
   * Expiration timestamp (millis since epoch)
   */
  expiresAt: number;
  /**
   * Time to live in seconds
   */
  ttl: number;
  /**
   * Creation timestamp
   */
  createdAt: number;
  /**
   * Number of times this entry was accessed
   */
  hits: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /**
   * Total number of cache hits
   */
  hits: number;
  /**
   * Total number of cache misses
   */
  misses: number;
  /**
   * Total number of items in cache
   */
  size: number;
  /**
   * Hit ratio (0-1)
   */
  hitRatio: number;
}

/**
 * Cache result (either a value or null)
 */
export type CacheResult<T> = {
  /**
   * Whether the value was found in cache
   */
  hit: true;
  /**
   * The cached value
   */
  value: T;
} | {
  /**
   * Whether the value was found in cache
   */
  hit: false;
  /**
   * The cached value (null)
   */
  value: null;
};

/**
 * Cache options
 */
export interface CacheOptions {
  /**
   * Time to live in seconds
   */
  ttl?: number;
  /**
   * Namespace/prefix for keys
   */
  namespace?: string;
  /**
   * Whether to track statistics
   */
  trackStats?: boolean;
}

/**
 * Cache interface - the core capability contract
 *
 * Defines cache semantics (WHAT), not implementation (HOW).
 * Adapters like Redis, Memcached, or in-memory implement this.
 */
export interface Cache {
  /**
   * Get a value from cache
   *
   * @param key - Cache key
   * @returns Cache result with hit status
   */
  get<T>(key: string): Promise<CacheResult<T>>;

  /**
   * Set a value in cache
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @param options - Cache options (TTL, etc.)
   */
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;

  /**
   * Delete a value from cache
   *
   * @param key - Cache key
   * @returns True if key was deleted, false if not found
   */
  del(key: string): Promise<boolean>;

  /**
   * Delete multiple keys from cache
   *
   * @param keys - Cache keys
   * @returns Number of keys deleted
   */
  delMany(keys: string[]): Promise<number>;

  /**
   * Check if a key exists in cache
   *
   * @param key - Cache key
   * @returns True if key exists
   */
  has(key: string): Promise<boolean>;

  /**
   * Clear all values from cache
   *
   * Use with caution - this affects all cached data.
   */
  clear(): Promise<void>;

  /**
   * Get cache statistics
   *
   * @returns Cache statistics (hits, misses, size, hit ratio)
   */
  getStats(): Promise<CacheStats>;

  /**
   * Reset cache statistics
   */
  resetStats(): Promise<void>;

  /**
   * Get multiple values at once
   *
   * @param keys - Cache keys
   * @returns Map of key to cache result
   */
  getMany<T>(keys: string[]): Promise<Map<string, CacheResult<T>>>;

  /**
   * Set multiple values at once
   *
   * @param entries - Key-value pairs
   * @param options - Cache options
   */
  setMany<T>(entries: Map<string, T>, options?: CacheOptions): Promise<void>;

  /**
   * Increment a counter in cache
   *
   * @param key - Cache key
   * @param delta - Amount to increment (default: 1)
   * @returns New value
   */
  incr(key: string, delta?: number): Promise<number>;

  /**
   * Decrement a counter in cache
   *
   * @param key - Cache key
   * @param delta - Amount to decrement (default: 1)
   * @returns New value
   */
  decr(key: string, delta?: number): Promise<number>;

  /**
   * Get or set pattern - return cached value or compute and cache it
   *
   * @param key - Cache key
   * @param factory - Function to compute value if not cached
   * @param options - Cache options
   * @returns Cached or computed value
   */
  getOrSet<T>(
    key: string,
    factory: () => T | Promise<T>,
    options?: CacheOptions
  ): Promise<T>;

  /**
   * Set with expiration (TTL)
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds
   */
  setex<T>(key: string, value: T, ttl: number): Promise<void>;

  /**
   * Set if not exists
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @param options - Cache options
   * @returns True if set, false if key already existed
   */
  setNX<T>(key: string, value: T, options?: CacheOptions): Promise<boolean>;

  /**
   * Get and delete (atomic)
   *
   * @param key - Cache key
   * @returns Cached value or null
   */
  getAndDel<T>(key: string): Promise<T | null>;

  /**
   * Get TTL of a key
   *
   * @param key - Cache key
   * @returns TTL in seconds, or -1 if key exists but has no expiry, or -2 if key doesn't exist
   */
  ttl(key: string): Promise<number>;
}

/**
 * Cache store interface for adapter implementations
 *
 * Lower-level interface that adapters implement.
 * The Cache class wraps this to provide semantics.
 */
export interface CacheStore {
  /**
   * Raw get from store
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Raw set in store
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Raw delete from store
   */
  del(key: string): Promise<boolean>;

  /**
   * Raw delete multiple
   */
  delMany(keys: string[]): Promise<number>;

  /**
   * Raw exists check
   */
  exists(key: string): Promise<boolean>;

  /**
   * Raw clear all
   */
  clear(): Promise<void>;

  /**
   * Raw increment
   */
  incr(key: string, delta: number): Promise<number>;

  /**
   * Raw decrement
   */
  decr(key: string, delta: number): Promise<number>;

  /**
   * Raw get TTL
   */
  ttl(key: string): Promise<number>;
}
