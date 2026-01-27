/**
 * Cache key utilities
 *
 * Provides consistent key generation, namespacing, and validation.
 */

/**
 * Cache key configuration
 */
export interface CacheKeyConfig {
  /**
   * Default namespace/prefix for all keys
   */
  namespace?: string;
  /**
   * Key delimiter (default: ':')
   */
  delimiter?: string;
  /**
   * Maximum key length (default: 250, Redis limit)
   */
  maxLength?: number;
}

/**
 * Cache key builder
 */
export class CacheKeyBuilder {
  private namespace: string;
  private delimiter: string;
  private maxLength: number;

  constructor(config: CacheKeyConfig = {}) {
    this.namespace = config.namespace || '';
    this.delimiter = config.delimiter || ':';
    this.maxLength = config.maxLength || 250;
  }

  /**
   * Build a cache key from parts
   *
   * @param parts - Key parts
   * @returns Formatted cache key
   */
  build(...parts: string[]): string {
    const key = parts.filter(Boolean).join(this.delimiter);

    if (this.namespace) {
      const fullKey = `${this.namespace}${this.delimiter}${key}`;
      if (fullKey.length > this.maxLength) {
        throw new Error(`Cache key too long: ${fullKey.length} > ${this.maxLength}`);
      }
      return fullKey;
    }

    if (key.length > this.maxLength) {
      throw new Error(`Cache key too long: ${key.length} > ${this.maxLength}`);
    }

    return key;
  }

  /**
   * Build a namespaced key
   *
   * @param namespace - Namespace
   * @param key - Key
   * @returns Formatted cache key
   */
  namespaced(namespace: string, key: string): string {
    return this.build(namespace, key);
  }

  /**
   * Build a user-specific key
   *
   * @param userId - User ID
   * @param resource - Resource type
   * @param identifier - Resource identifier
   * @returns Formatted cache key
   */
  userResource(userId: string, resource: string, identifier: string): string {
    return this.build('user', userId, resource, identifier);
  }

  /**
   * Build a session key
   *
   * @param sessionId - Session ID
   * @returns Formatted cache key
   */
  session(sessionId: string): string {
    return this.build('session', sessionId);
  }

  /**
   * Build a rate limit key
   *
   * @param identifier - User/IP/identifier
   * @param window - Rate limit window
   * @returns Formatted cache key
   */
  rateLimit(identifier: string, window: string): string {
    return this.build('ratelimit', identifier, window);
  }

  /**
   * Hash a key (for long keys)
   *
   * @param key - Key to hash
   * @returns Hashed key
   */
  hash(key: string): string {
    // Simple hash function - in production use crypto.createHash
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash:${Math.abs(hash).toString(36)}`;
  }

  /**
   * Create a new builder with a different namespace
   *
   * @param namespace - New namespace
   * @returns New CacheKeyBuilder
   */
  withNamespace(namespace: string): CacheKeyBuilder {
    return new CacheKeyBuilder({
      namespace,
      delimiter: this.delimiter,
      maxLength: this.maxLength,
    });
  }
}

/**
 * Default cache key builder
 */
export const defaultKeyBuilder = new CacheKeyBuilder();

/**
 * Build a cache key (convenience function)
 *
 * @param parts - Key parts
 * @returns Formatted cache key
 */
export function cacheKey(...parts: string[]): string {
  return defaultKeyBuilder.build(...parts);
}
