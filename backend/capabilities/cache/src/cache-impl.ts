
import {
    Cache,
    CacheStore,
    CacheResult,
    CacheOptions,
    CacheStats
} from './cache.js';
import {
    CacheConfig,
    defaultCacheConfig,
    EvictionPolicy
} from './policies.js';
import { defaultKeyBuilder } from './cache-key.js';

/**
 * Default implementation of the Cache capability
 */
export class DefaultCache implements Cache {
    private store: CacheStore;
    private config: CacheConfig;
    private stats: CacheStats = {
        hits: 0,
        misses: 0,
        size: 0,
        hitRatio: 0
    };

    constructor(store: CacheStore, config: CacheConfig = {}) {
        this.store = store;
        this.config = { ...defaultCacheConfig, ...config };
    }

    /**
     * Get a value from cache
     */
    async get<T>(key: string): Promise<CacheResult<T>> {
        const namespacedKey = this.getNamespacedKey(key);

        try {
            const value = await this.store.get<T>(namespacedKey);

            if (value !== null) {
                this.updateStats(true);
                return { hit: true, value };
            } else {
                this.updateStats(false);
                return { hit: false, value: null };
            }
        } catch (error) {
            // Fail safe - if cache fails, treat as miss
            console.warn(`Cache get error for key ${key}:`, error);
            this.updateStats(false);
            return { hit: false, value: null };
        }
    }

    /**
     * Set a value in cache
     */
    async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
        const namespacedKey = this.getNamespacedKey(key);
        const ttl = options?.ttl ?? this.config.defaultTTL;

        try {
            await this.store.set(namespacedKey, value, ttl);
            if (this.config.trackStats) {
                // Size estimation is rough as we delegate to store
            }
        } catch (error) {
            console.warn(`Cache set error for key ${key}:`, error);
        }
    }

    /**
     * Delete a value from cache
     */
    async del(key: string): Promise<boolean> {
        const namespacedKey = this.getNamespacedKey(key);
        try {
            return await this.store.del(namespacedKey);
        } catch (error) {
            console.warn(`Cache del error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete multiple keys from cache
     */
    async delMany(keys: string[]): Promise<number> {
        const namespacedKeys = keys.map(k => this.getNamespacedKey(k));
        try {
            return await this.store.delMany(namespacedKeys);
        } catch (error) {
            console.warn(`Cache delMany error:`, error);
            return 0;
        }
    }

    /**
     * Check if a key exists in cache
     */
    async has(key: string): Promise<boolean> {
        const namespacedKey = this.getNamespacedKey(key);
        try {
            return await this.store.exists(namespacedKey);
        } catch (error) {
            return false;
        }
    }

    /**
     * Clear all values from cache
     * Note: This attempts to clear only namespaced keys if namespace is set,
     * but underlying store might not support pattern deletion easily.
     * If namespace is used, we should ideally use pattern deletion.
     */
    async clear(): Promise<void> {
        // If namespace is set, we really should only clear keys with that prefix.
        // However, the Store interface 'clear' usually means 'flush everything'.
        // For now, we'll delegate to store.clear() which might be dangerous
        // if sharing the store/redis instance.
        // Ideally the store implementation handles separation/safety.
        try {
            await this.store.clear();
            this.resetStats();
        } catch (error) {
            console.warn(`Cache clear error:`, error);
        }
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<CacheStats> {
        if (this.config.trackStats) {
            return { ...this.stats };
        }
        return { hits: 0, misses: 0, size: 0, hitRatio: 0 };
    }

    /**
     * Reset cache statistics
     */
    async resetStats(): Promise<void> {
        this.stats = { hits: 0, misses: 0, size: 0, hitRatio: 0 };
    }

    /**
     * Get multiple values at once
     */
    async getMany<T>(keys: string[]): Promise<Map<string, CacheResult<T>>> {
        const result = new Map<string, CacheResult<T>>();
        // Naive implementation - parallel gets
        // Optimizations should be done in the Store if it supports mget
        await Promise.all(
            keys.map(async (key) => {
                const res = await this.get<T>(key);
                result.set(key, res);
            })
        );
        return result;
    }

    /**
     * Set multiple values at once
     */
    async setMany<T>(entries: Map<string, T>, options?: CacheOptions): Promise<void> {
        await Promise.all(
            Array.from(entries.entries()).map(([key, value]) =>
                this.set(key, value, options)
            )
        );
    }

    /**
     * Increment a counter in cache
     */
    async incr(key: string, delta: number = 1): Promise<number> {
        const namespacedKey = this.getNamespacedKey(key);
        return this.store.incr(namespacedKey, delta);
    }

    /**
     * Decrement a counter in cache
     */
    async decr(key: string, delta: number = 1): Promise<number> {
        const namespacedKey = this.getNamespacedKey(key);
        return this.store.decr(namespacedKey, delta);
    }

    /**
     * Get or set pattern
     */
    async getOrSet<T>(
        key: string,
        factory: () => T | Promise<T>,
        options?: CacheOptions
    ): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached.hit) {
            return cached.value;
        }

        const value = await factory();
        await this.set(key, value, options);
        return value;
    }

    /**
     * Set with expiration (TTL)
     */
    async setex<T>(key: string, value: T, ttl: number): Promise<void> {
        await this.set(key, value, { ttl });
    }

    /**
     * Set if not exists
     */
    async setNX<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
        const exists = await this.has(key);
        if (!exists) {
            await this.set(key, value, options);
            return true;
        }
        return false;
    }

    /**
     * Get and delete (atomic if possible, here sequence)
     */
    async getAndDel<T>(key: string): Promise<T | null> {
        const result = await this.get<T>(key);
        if (result.hit) {
            await this.del(key);
            return result.value;
        }
        return null;
    }

    /**
     * Get TTL of a key
     */
    async ttl(key: string): Promise<number> {
        const namespacedKey = this.getNamespacedKey(key);
        return this.store.ttl(namespacedKey);
    }

    private getNamespacedKey(key: string): string {
        if (this.config.namespace) {
            return defaultKeyBuilder.namespaced(this.config.namespace, key);
        }
        return key;
    }

    private updateStats(hit: boolean) {
        if (!this.config.trackStats) return;

        if (hit) {
            this.stats.hits++;
        } else {
            this.stats.misses++;
        }

        const total = this.stats.hits + this.stats.misses;
        this.stats.hitRatio = total > 0 ? this.stats.hits / total : 0;
    }
}

/**
 * Create a cache instance
 */
export function createCache(store: CacheStore, config?: CacheConfig): Cache {
    return new DefaultCache(store, config);
}
