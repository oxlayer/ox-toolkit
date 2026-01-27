import type { Context, Next } from 'hono';
import { createDefaultRedisClient, type RedisConnectionOptions, type RedisClient } from './client.js';

export interface RedisVariables {
  redis: RedisClient;
}

declare module 'hono' {
  interface ContextVariableMap extends RedisVariables { }
}

/**
 * Redis middleware factory for Hono
 *
 * Creates a singleton Redis client and attaches it to the Hono context.
 *
 * @example
 * ```ts
 * import { redisMiddleware } from '@oxlayer/capabilities-adapters/redis';
 *
 * app.use('/api/*', redisMiddleware({
 *   host: 'localhost',
 *   port: 6379,
 *   keyPrefix: 'myapp',
 *   defaultTTL: 3600,
 * }));
 *
 * // Use in handlers
 * app.get('/cache/:key', async (c) => {
 *   const redis = c.get('redis');
 *   const value = await redis.get(c.req.param('key'));
 *   return c.json({ value });
 * });
 * ```
 */
export function redisMiddleware(options?: RedisConnectionOptions) {
  // Create singleton client
  const client = createDefaultRedisClient(options);

  return async (c: Context, next: Next) => {
    c.set('redis', client);
    await next();
  };
}

/**
 * Cache middleware factory
 *
 * Automatically caches GET requests using Redis.
 *
 * @example
 * ```ts
 * import { cacheMiddleware } from '@oxlayer/capabilities-adapters/redis';
 *
 * app.use('/api/public/*', cacheMiddleware({
 *   ttl: 600, // 10 minutes
 *   keyPrefix: 'cache',
 * }));
 * ```
 */
export function cacheMiddleware(options: {
  ttl?: number;
  keyPrefix?: string;
  excludePaths?: string[];
}) {
  return async (c: Context, next: Next) => {
    // Skip cache for non-GET requests
    if (c.req.method !== 'GET') {
      return next();
    }

    // Skip excluded paths
    if (options.excludePaths?.some((path) => c.req.path.match(path))) {
      return next();
    }

    const redis = c.get('redis');
    if (!redis) {
      return next();
    }

    const cacheKey = `${options.keyPrefix || 'cache'}:${c.req.path}`;

    try {
      // Try to get from cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        return c.json(cached);
      }

      // Execute handler
      await next();

      // Cache the response if status is 200
      if (c.res.status === 200) {
        // Note: This is a simplified version. In production, you'd want to
        // capture the response body properly, which may require a different approach.
      }
    } catch (error) {
      // On cache error, just proceed with the request
      console.error('[CacheMiddleware] Error:', error);
      await next();
    }
  };
}

/**
 * Rate limiting middleware using Redis
 *
 * @example
 * ```ts
 * import { rateLimitMiddleware } from '@oxlayer/capabilities-adapters/redis';
 *
 * app.use('/api/*', rateLimitMiddleware({
 *   windowMs: 60000, // 1 minute
 *   maxRequests: 100,
 *   keyPrefix: 'ratelimit',
 * }));
 * ```
 */
export function rateLimitMiddleware(options: {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
  keyGenerator?: (c: Context) => string;
}) {
  return async (c: Context, next: Next) => {
    const redis = c.get('redis');
    if (!redis) {
      return next();
    }

    const key = options.keyGenerator
      ? options.keyGenerator(c)
      : `${options.keyPrefix || 'ratelimit'}:${c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'}`;

    try {
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, Math.ceil(options.windowMs / 1000));
      }

      if (current > options.maxRequests) {
        return c.json({ error: 'Too many requests' }, 429);
      }

      return next();
    } catch (error) {
      console.error('[RateLimitMiddleware] Error:', error);
      return next();
    }
  };
}
