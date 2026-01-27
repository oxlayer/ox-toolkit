import Redis from 'ioredis';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  /**
   * Connection timeout in milliseconds
   */
  connectTimeout?: number;
  /**
   * Maximum number of retry attempts
   */
  maxRetriesPerRequest?: number;
  /**
   * Enable offline queue
   */
  enableOfflineQueue?: boolean;
  /**
   * Enable ready check
   */
  enableReadyCheck?: boolean;
}

export interface RedisConnectionOptions extends RedisConfig {
  /**
   * Key prefix for all keys
   */
  keyPrefix?: string;
  /**
   * Default TTL in seconds
   */
  defaultTTL?: number;
}

/**
 * Redis client wrapper using ioredis
 *
 * Provides a simplified interface for common Redis operations
 * with automatic key prefixing and TTL management.
 */
export class RedisClient {
  private client: Redis;
  private keyPrefix: string;
  private defaultTTL: number;

  constructor(options: RedisConnectionOptions) {
    this.keyPrefix = options.keyPrefix || '';
    this.defaultTTL = options.defaultTTL || 3600; // 1 hour default

    this.client = new Redis({
      host: options.host,
      port: options.port,
      password: options.password,
      db: options.db || 0,
      connectTimeout: options.connectTimeout || 10000,
      maxRetriesPerRequest: options.maxRetriesPerRequest || 3,
      enableOfflineQueue: options.enableOfflineQueue !== false,
      enableReadyCheck: options.enableReadyCheck !== false,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      console.log(`[RedisClient] Connected to ${options.host}:${options.port}`);
    });

    this.client.on('error', (error) => {
      console.error('[RedisClient] Error:', error);
    });

    this.client.on('close', () => {
      console.warn('[RedisClient] Connection closed');
    });
  }

  /**
   * Get a value by key
   */
  async get<T = string>(key: string): Promise<T | null> {
    const fullKey = this.getFullKey(key);
    const value = await this.client.get(fullKey);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  /**
   * Set a value by key with optional TTL
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const fullKey = this.getFullKey(key);
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    if (ttl || this.defaultTTL) {
      await this.client.setex(fullKey, ttl || this.defaultTTL, serialized);
    } else {
      await this.client.set(fullKey, serialized);
    }
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<number> {
    const fullKey = this.getFullKey(key);
    return this.client.del(fullKey);
  }

  /**
   * Delete multiple keys
   */
  async delMany(keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    const fullKeys = keys.map((k) => this.getFullKey(k));
    return this.client.del(...fullKeys);
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    const result = await this.client.exists(fullKey);
    return result === 1;
  }

  /**
   * Set a key with expiration
   */
  async setex(key: string, seconds: number, value: unknown): Promise<void> {
    const fullKey = this.getFullKey(key);
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.client.setex(fullKey, seconds, serialized);
  }

  /**
   * Set a key only if it doesn't exist
   */
  async setnx(key: string, value: unknown): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const result = await this.client.setnx(fullKey, serialized);
    return result === 1;
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    const fullKey = this.getFullKey(key);
    return this.client.incr(fullKey);
  }

  /**
   * Increment a counter by amount
   */
  async incrby(key: string, amount: number): Promise<number> {
    const fullKey = this.getFullKey(key);
    return this.client.incrby(fullKey, amount);
  }

  /**
   * Decrement a counter
   */
  async decr(key: string): Promise<number> {
    const fullKey = this.getFullKey(key);
    return this.client.decr(fullKey);
  }

  /**
   * Decrement a counter by amount
   */
  async decrby(key: string, amount: number): Promise<number> {
    const fullKey = this.getFullKey(key);
    return this.client.decrby(fullKey, amount);
  }

  /**
   * Get TTL of a key
   */
  async ttl(key: string): Promise<number> {
    const fullKey = this.getFullKey(key);
    return this.client.ttl(fullKey);
  }

  /**
   * Set expiration on a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    const result = await this.client.expire(fullKey, seconds);
    return result === 1;
  }

  /**
   * Get all keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    const fullPattern = this.getFullKey(pattern);
    return this.client.keys(fullPattern);
  }

  /**
   * Get multiple values
   */
  async mget<T = string>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    const fullKeys = keys.map((k) => this.getFullKey(k));
    const values = await this.client.mget(...fullKeys);

    return values.map((v) => {
      if (!v) return null;
      try {
        return JSON.parse(v) as T;
      } catch {
        return v as T;
      }
    });
  }

  /**
   * Set multiple values
   */
  async mset(keyValuePairs: Record<string, unknown>): Promise<void> {
    const fullPairs: string[] = [];
    for (const [key, value] of Object.entries(keyValuePairs)) {
      fullPairs.push(this.getFullKey(key));
      fullPairs.push(typeof value === 'string' ? value : JSON.stringify(value));
    }
    await this.client.mset(...fullPairs);
  }

  /**
   * Add to a sorted set
   */
  async zadd(key: string, score: number, member: string): Promise<number> {
    const fullKey = this.getFullKey(key);
    return this.client.zadd(fullKey, score, member);
  }

  /**
   * Get range from sorted set
   */
  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    const fullKey = this.getFullKey(key);
    return this.client.zrange(fullKey, start, stop);
  }

  /**
   * Get range from sorted set with scores
   */
  async zrangeWithScores(
    key: string,
    start: number,
    stop: number
  ): Promise<Array<{ member: string; score: number }>> {
    const fullKey = this.getFullKey(key);
    const results = await this.client.zrange(fullKey, start, stop, 'WITHSCORES');

    const pairs: Array<{ member: string; score: number }> = [];
    for (let i = 0; i < results.length; i += 2) {
      pairs.push({
        member: results[i],
        score: parseFloat(results[i + 1]),
      });
    }
    return pairs;
  }

  /**
   * Remove from sorted set
   */
  async zrem(key: string, member: string): Promise<number> {
    const fullKey = this.getFullKey(key);
    return this.client.zrem(fullKey, member);
  }

  /**
   * Add to a set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    const fullKey = this.getFullKey(key);
    return this.client.sadd(fullKey, ...members);
  }

  /**
   * Get all members of a set
   */
  async smembers(key: string): Promise<string[]> {
    const fullKey = this.getFullKey(key);
    return this.client.smembers(fullKey);
  }

  /**
   * Check if member exists in set
   */
  async sismember(key: string, member: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    const result = await this.client.sismember(fullKey, member);
    return result === 1;
  }

  /**
   * Remove from set
   */
  async srem(key: string, ...members: string[]): Promise<number> {
    const fullKey = this.getFullKey(key);
    return this.client.srem(fullKey, ...members);
  }

  /**
   * Push to list (left)
   */
  async lpush(key: string, ...values: string[]): Promise<number> {
    const fullKey = this.getFullKey(key);
    return this.client.lpush(fullKey, ...values);
  }

  /**
   * Push to list (right)
   */
  async rpush(key: string, ...values: string[]): Promise<number> {
    const fullKey = this.getFullKey(key);
    return this.client.rpush(fullKey, ...values);
  }

  /**
   * Pop from list (left)
   */
  async lpop(key: string): Promise<string | null> {
    const fullKey = this.getFullKey(key);
    return this.client.lpop(fullKey);
  }

  /**
   * Pop from list (right)
   */
  async rpop(key: string): Promise<string | null> {
    const fullKey = this.getFullKey(key);
    return this.client.rpop(fullKey);
  }

  /**
   * Get list range
   */
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const fullKey = this.getFullKey(key);
    return this.client.lrange(fullKey, start, stop);
  }

  /**
   * Get list length
   */
  async llen(key: string): Promise<number> {
    const fullKey = this.getFullKey(key);
    return this.client.llen(fullKey);
  }

  /**
   * Execute a transaction
   */
  async multi(
    commands: Array<(client: Redis) => Promise<unknown>>
  ): Promise<unknown[]> {
    const multi = this.client.multi();
    for (const cmd of commands) {
      cmd(multi as any);
    }
    const result = await multi.exec();
    // ioredis returns [error, result][] | null
    return result ? result.map(([, r]) => r) : [];
  }

  /**
   * Flush all keys (use with caution)
   */
  async flushdb(): Promise<void> {
    await this.client.flushdb();
  }

  /**
   * Get the underlying ioredis client
   */
  getRawClient(): Redis {
    return this.client;
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  /**
   * Quit connection
   */
  async quit(): Promise<void> {
    await this.client.quit();
  }

  /**
   * Ping Redis server
   */
  async ping(): Promise<string> {
    return this.client.ping();
  }

  /**
   * Get Redis info
   */
  async info(section?: string): Promise<string> {
    if (section) {
      return this.client.info(section);
    }
    return this.client.info();
  }

  private getFullKey(key: string): string {
    return this.keyPrefix ? `${this.keyPrefix}:${key}` : key;
  }
}

/**
 * Create a Redis client
 */
export function createRedisClient(options: RedisConnectionOptions): RedisClient {
  return new RedisClient(options);
}

/**
 * Default Redis client for quick access
 * Can be configured via environment variables:
 * - REDIS_HOST
 * - REDIS_PORT
 * - REDIS_PASSWORD
 * - REDIS_DB
 */
export function createDefaultRedisClient(options?: Partial<RedisConnectionOptions>): RedisClient {
  return createRedisClient({
    host: options?.host || process.env.REDIS_HOST || 'localhost',
    port: options?.port || Number(process.env.REDIS_PORT) || 6379,
    password: options?.password || process.env.REDIS_PASSWORD,
    db: options?.db || Number(process.env.REDIS_DB) || 0,
    keyPrefix: options?.keyPrefix,
    defaultTTL: options?.defaultTTL,
    connectTimeout: options?.connectTimeout,
    maxRetriesPerRequest: options?.maxRetriesPerRequest,
    enableOfflineQueue: options?.enableOfflineQueue,
    enableReadyCheck: options?.enableReadyCheck,
  });
}
