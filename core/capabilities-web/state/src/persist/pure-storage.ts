/**
 * @oxlayer/capabilities-state/persist
 *
 * Pure Persistence Layer (Intent-Native)
 *
 * This is a clean, focused persistence layer that:
 * - Stores data locally (SQLite + memory)
 * - Is fast and deterministic
 * - Is crash-safe
 * - Exposes metadata
 *
 * What it does NOT do (by design):
 * - No API calls
 * - No retry logic
 * - No race logic
 * - No conflict resolution
 *
 * Those responsibilities are handled by the Intent system.
 *
 * Architecture:
 * ┌────────────────────┐
 * │ UI / Legend-State  │
 * └─────────┬──────────┘
 *           ▼
 * ┌────────────────────┐
 * │ Intent System      │  ← network, retry, conflict
 * └─────────┬──────────┘
 *           ▼
 * ┌────────────────────┐
 * │ Pure Storage       │  ← This module
 * └─────────┬──────────┘
 *           ▼
 * ┌────────────────────┐
 * │ SQLite / Memory    │
 * └────────────────────┘
 *
 * @example
 * ```ts
 * import { pureStorage, recordIntent } from '@oxlayer/capabilities-state';
 *
 * // Direct storage (local only, no sync)
 * await pureStorage.set('my-key', { data: 'value' });
 * const value = await pureStorage.get('my-key');
 *
 * // With Intent sync (offline-first, sync to API)
 * await pureStorage.set('my-key', { data: 'value' });
 *
 * recordIntent(workspaceId, {
 *   domain: 'storage',
 *   type: 'update',
 *   entityType: 'key',
 *   entityId: 'my-key',
 *   payload: { data: 'value' },
 *   policy: IntentPresets.optimistic,
 * });
 * ```
 */

import type { SqliteAdapter } from './index';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Versioned stored value for safe API races and conflict resolution
 */
export interface StoredValue<T = unknown> {
  /** The actual value */
  value: T;
  /** Monotonically increasing version per key */
  version: number;
  /** Unix timestamp in milliseconds */
  updatedAt: number;
}

/**
 * Storage read result with metadata
 */
export interface StoredResult<T = unknown> {
  data: T | null;
  version: number;
  updatedAt: number;
  source: 'memory' | 'sqlite';
}

/**
 * Pure storage configuration
 */
export interface PureStorageConfig {
  /** SQLite storage adapter */
  sqlite: SqliteAdapter;
  /** Enable debug logging */
  debug?: boolean;
  /** Memory cache size limit (0 = unlimited) */
  cacheSizeLimit?: number;
}

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

interface CacheEntry<T> {
  value: T;
  version: number;
  updatedAt: number;
}

class MemoryCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private sizeLimit: number;

  constructor(sizeLimit: number = 1000) {
    this.sizeLimit = sizeLimit;
  }

  get(key: string): CacheEntry<T> | undefined {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  set(key: string, entry: CacheEntry<T>): void {
    // Enforce size limit by evicting oldest entries
    if (this.sizeLimit > 0 && this.cache.size >= this.sizeLimit) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, entry);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// ============================================================================
// PURE STORAGE IMPLEMENTATION
// ============================================================================

class PureStorage {
  private memoryCache: MemoryCache;
  private sqlite: SqliteAdapter;
  private debug: boolean;
  private pendingWrites = new Set<Promise<void>>();

  constructor(config: PureStorageConfig) {
    this.sqlite = config.sqlite;
    this.debug = config.debug ?? false;
    this.memoryCache = new MemoryCache(config.cacheSizeLimit ?? 1000);
  }

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[PureStorage]', ...args);
    }
  }

  /**
   * Get a value from storage with metadata
   *
   * Strategy:
   * 1. Check memory cache (fastest)
   * 2. Check SQLite (persistent)
   *
   * Returns StoredResult with version/updatedAt for Intent system
   */
  async get<T = unknown>(key: string): Promise<StoredResult<T>> {
    // 1. Check memory cache
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key)!;
      this.log('get (memory)', key, entry.version);
      return {
        data: entry.value as T,
        version: entry.version,
        updatedAt: entry.updatedAt,
        source: 'memory',
      };
    }

    // 2. Check SQLite
    try {
      const raw = await this.sqlite.getItem(key);
      if (raw) {
        const stored = this.parseStoredValue<T>(raw);
        // Update memory cache
        this.memoryCache.set(key, {
          value: stored.value,
          version: stored.version,
          updatedAt: stored.updatedAt,
        });
        this.log('get (sqlite)', key, stored.version);
        return {
          data: stored.value,
          version: stored.version,
          updatedAt: stored.updatedAt,
          source: 'sqlite',
        };
      }
    } catch (error) {
      console.error('[PureStorage] SQLite read failed:', error);
    }

    // Not found
    this.log('get (miss)', key);
    return {
      data: null,
      version: 0,
      updatedAt: 0,
      source: 'sqlite',
    };
  }

  /**
   * Set a value in storage
   *
   * Strategy:
   * 1. Update memory cache immediately (sync)
   * 2. Write to SQLite (async, fire-and-forget)
   *
   * Returns version info for Intent system to use in API sync
   */
  async set<T = unknown>(key: string, value: T): Promise<StoredValue<T>> {
    const now = Date.now();

    // Get current version for optimistic increment
    const currentEntry = this.memoryCache.get(key);
    const newVersion = (currentEntry?.version ?? 0) + 1;

    const storedValue: StoredValue<T> = {
      value,
      version: newVersion,
      updatedAt: now,
    };

    // 1. Update memory cache immediately (sync)
    this.memoryCache.set(key, {
      value,
      version: newVersion,
      updatedAt: now,
    });

    // 2. Write to SQLite (async, fire-and-forget)
    const sqliteWrite = this.writeToSQLite(key, storedValue);
    this.pendingWrites.add(sqliteWrite);
    sqliteWrite.finally(() => {
      this.pendingWrites.delete(sqliteWrite);
    });

    // Don't await - writes in background
    sqliteWrite.catch(err => {
      console.warn('[PureStorage] SQLite write failed (data may be lost on refresh):', err);
    });

    this.log('set', key, newVersion);
    return storedValue;
  }

  /**
   * Delete a value from storage
   */
  async delete(key: string): Promise<void> {
    // 1. Remove from memory cache
    this.memoryCache.delete(key);

    // 2. Remove from SQLite (async)
    const sqliteDelete = this.sqlite.removeItem(key);
    this.pendingWrites.add(sqliteDelete);
    sqliteDelete.finally(() => {
      this.pendingWrites.delete(sqliteDelete);
    });

    this.log('delete', key);
  }

  /**
   * Get all keys from storage
   */
  async keys(): Promise<string[]> {
    try {
      if (this.sqlite.getAllKeys) {
        return await this.sqlite.getAllKeys();
      }
    } catch (error) {
      console.error('[PureStorage] Failed to get keys:', error);
    }
    return [];
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear SQLite
    try {
      if (this.sqlite.clear) {
        await this.sqlite.clear();
      }
    } catch (error) {
      console.error('[PureStorage] Failed to clear SQLite:', error);
    }

    this.log('clear');
  }

  /**
   * Flush pending writes to ensure durability
   *
   * Use before:
   * - Logout
   * - Export
   * - App close
   * - Tests
   */
  async flush(): Promise<void> {
    await Promise.all(Array.from(this.pendingWrites));
    this.log('flush');
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private async writeToSQLite(key: string, storedValue: StoredValue): Promise<void> {
    try {
      await this.sqlite.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error('[PureStorage] SQLite write failed:', error);
      throw error;
    }
  }

  private parseStoredValue<T>(raw: string | null): StoredValue<T> {
    if (!raw) {
      return { value: null as T, version: 0, updatedAt: 0 };
    }

    try {
      const parsed = JSON.parse(raw);
      // Check if it's a StoredValue structure
      if (
        parsed &&
        typeof parsed === 'object' &&
        'value' in parsed &&
        'version' in parsed &&
        'updatedAt' in parsed
      ) {
        return parsed as StoredValue<T>;
      }
    } catch {
      // Not JSON, treat as legacy plain value
    }

    // Legacy value - wrap it with default metadata
    return {
      value: raw as T,
      version: 1,
      updatedAt: Date.now(),
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let pureStorageInstance: PureStorage | null = null;

/**
 * Get or create the pure storage singleton
 */
export function getPureStorage(config: PureStorageConfig): PureStorage {
  if (!pureStorageInstance) {
    pureStorageInstance = new PureStorage(config);
  }
  return pureStorageInstance;
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Get a value from storage with metadata
 */
export async function getStoredValue<T = unknown>(
  config: PureStorageConfig,
  key: string
): Promise<StoredResult<T>> {
  const storage = getPureStorage(config);
  return storage.get<T>(key);
}

/**
 * Set a value in storage
 */
export async function setStoredValue<T = unknown>(
  config: PureStorageConfig,
  key: string,
  value: T
): Promise<StoredValue<T>> {
  const storage = getPureStorage(config);
  return storage.set<T>(key, value);
}

/**
 * Delete a value from storage
 */
export async function deleteStoredValue(
  config: PureStorageConfig,
  key: string
): Promise<void> {
  const storage = getPureStorage(config);
  return storage.delete(key);
}

/**
 * Get all keys from storage
 */
export async function getStoredKeys(config: PureStorageConfig): Promise<string[]> {
  const storage = getPureStorage(config);
  return storage.keys();
}

/**
 * Clear all storage
 */
export async function clearStoredValues(config: PureStorageConfig): Promise<void> {
  const storage = getPureStorage(config);
  return storage.clear();
}

/**
 * Flush pending writes for durability
 */
export async function flushStorage(config: PureStorageConfig): Promise<void> {
  const storage = getPureStorage(config);
  return storage.flush();
}
