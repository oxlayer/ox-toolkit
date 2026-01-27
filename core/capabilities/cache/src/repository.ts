
import { Cache } from './cache.js';

export interface CacheKeyGenerator {
    (entity: string, operation: string, params: any): string;
}

export interface CachedRepositoryOptions {
    cacheStore: Cache;
    ttl?: Record<string, number>;
    generateKey?: CacheKeyGenerator;
}

/**
 * Create a cached repository decorator/wrapper
 *
 * Provides caching behavior for repository methods.
 */
export function createCachedRepository(options: CachedRepositoryOptions) {
    const { cacheStore, ttl = {}, generateKey } = options;

    // This implementation returns a Method Decorator factory
    // Usage: @Cached({ entity: 'User', operation: 'find' })
    // But based on the config usage:
    // createCachedRepository({ ... }) -> returns the decorator itself?
    //
    // Actually, standard decorators work on classes/methods.
    // The redis.config.ts returns the result of createCachedRepository.
    // We'll assume it returns a function that can be used as a decorator
    // or a wrapper.

    return function (entity: string, operation: string) {
        return function (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) {
            const originalMethod = descriptor.value;

            descriptor.value = async function (...args: any[]) {
                // Determine TTL for this operation
                const operationTtl = ttl[operation] || 300; // Default 5 mins

                // Generate cache key
                let key = '';
                if (generateKey) {
                    key = generateKey(entity, operation, args);
                } else {
                    key = `${entity}:${operation}:${JSON.stringify(args)}`;
                }

                // Try cache
                const cached = await cacheStore.get(key);
                if (cached.hit) {
                    return cached.value;
                }

                // Call original
                const result = await originalMethod.apply(this, args);

                // Cache result (if not null/undefined)
                if (result !== null && result !== undefined) {
                    await cacheStore.set(key, result, { ttl: operationTtl });
                }

                return result;
            };

            return descriptor;
        };
    };
}
