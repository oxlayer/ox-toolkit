/**
 * Redis Cache Configuration
 */

import { createRedisClient, createRedisCacheStore } from '@oxlayer/capabilities-adapters-redis';
import { createCache, createCachedRepository } from '@oxlayer/capabilities-cache';

import { ENV } from './app.config.js';

/**
 * Create Redis connection
 */
export function createRedisConnection() {
  return createRedisClient({
    host: ENV.REDIS_HOST,
    port: ENV.REDIS_PORT,
    password: ENV.REDIS_PASSWORD,
    db: ENV.REDIS_DB,
    // Connection pool settings
    maxRetriesPerRequest: 3,
  });
}

/**
 * Create Redis Cache Store
 *
 * Wraps Redis client with cache-specific operations:
 * - Automatic TTL management
 * - Key prefixing
 * - Cache statistics
 */
export function createRedisStore(redis: ReturnType<typeof createRedisConnection>) {
  const store = createRedisCacheStore(redis);
  return createCache(store, {
    // Default TTL for cached items (5 minutes)
    defaultTTL: 300,
    // Key prefix for all cache keys
    namespace: 'alo-manager:',
  });
}

/**
 * Create cached repository decorator
 *
 * Wraps any repository method with automatic caching
 */
export function createCachedDecorator(cacheStore: any) {
  return createCachedRepository({
    cacheStore,
    // TTL for different operations
    ttl: {
      find: 60, // 1 minute for find operations
      list: 30, // 30 seconds for list operations
      count: 60, // 1 minute for count operations
    },
    // Cache key generator
    generateKey: (entity: string, operation: string, params: any) => {
      return `${entity}:${operation}:${JSON.stringify(params)}`;
    },
  });
}
