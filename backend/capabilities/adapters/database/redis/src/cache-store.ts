import type { CacheStore } from '@oxlayer/capabilities-cache';
import type { RedisClient } from './client.js';

/**
 * Redis cache store implementation
 *
 * Implements CacheStore interface using Redis.
 * This is the HOW (implementation) for the cache WHAT (capability).
 *
 * @example
 * ```ts
 * import { RedisCache } from '@oxlayer/capabilities-adapters-redis';
 * import { createRedisClient } from '@oxlayer/capabilities-adapters-redis';
 *
 * const redis = createRedisClient({ host: 'localhost', port: 6379 });
 * const cache = new RedisCache(redis);
 *
 * await cache.set('user:123', userData, { ttl: 300 });
 * const user = await cache.get('user:123');
 * ```
 */
export class RedisCacheStore implements CacheStore {
  private stats: { hits: number; misses: number } = { hits: 0, misses: 0 };

  constructor(private redis: RedisClient) { }

  /**
   * Get a value from Redis
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get<T>(key);

    if (value !== null) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }

    return value;
  }

  /**
   * Set a value in Redis
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.redis.set(key, value, ttl);
  }

  /**
   * Delete a value from Redis
   */
  async del(key: string): Promise<boolean> {
    const result = await this.redis.del(key);
    return result > 0;
  }

  /**
   * Delete multiple values from Redis
   */
  async delMany(keys: string[]): Promise<number> {
    return this.redis.delMany(keys);
  }

  /**
   * Check if a key exists in Redis
   */
  async exists(key: string): Promise<boolean> {
    return this.redis.exists(key);
  }

  /**
   * Clear all values (use with caution!)
   */
  async clear(): Promise<void> {
    // Only clear keys with the configured prefix if set
    // Otherwise, this would clear the entire Redis database
    // This is a safety feature - explicit flushdb should be called directly
    throw new Error(
      'RedisCacheStore.clear() is not supported for safety. ' +
      'Use redis.flushdb() directly if you want to clear the entire database, ' +
      'or iterate and delete keys with a specific prefix.'
    );
  }

  /**
   * Increment a counter
   */
  async incr(key: string, delta: number = 1): Promise<number> {
    if (delta === 1) {
      return this.redis.incr(key);
    }
    return this.redis.incrby(key, delta);
  }

  /**
   * Decrement a counter
   */
  async decr(key: string, delta: number = 1): Promise<number> {
    if (delta === 1) {
      return this.redis.decr(key);
    }
    return this.redis.decrby(key, delta);
  }

  /**
   * Get TTL of a key
   */
  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  /**
   * Get cache statistics
   */
  getStats(): { hits: number; misses: number } {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Get the underlying Redis client
   */
  getRedisClient(): RedisClient {
    return this.redis;
  }
}

/**
 * Create a Redis cache store
 *
 * @param redis - RedisClient instance
 * @returns RedisCacheStore instance
 */
export function createRedisCacheStore(redis: RedisClient): RedisCacheStore {
  return new RedisCacheStore(redis);
}
