/**
 * Redis Configuration
 */

import { createRedis } from '@oxlayer/capabilities-adapters-redis';

/**
 * Create Redis connection
 */
export async function createRedisConnection() {
  return createRedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB) || 0,
  });
}
