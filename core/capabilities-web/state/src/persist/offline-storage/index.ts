/**
 * @oxlayer/capabilities-state/persist/offline-storage
 *
 * Offline-first storage layer for web applications.
 *
 * This module provides a unified storage interface that coordinates multiple storage backends:
 * - In-memory cache (fastest)
 * - SQLite OPFS (persistent, fast - SOURCE OF TRUTH)
 * - localStorage (fallback only, never beats SQLite)
 * - API (optional, with race-based reads and version checks)
 *
 * Architecture Principles (Notion-inspired):
 * 1. SQLite is the source of truth - localStorage is ONLY a fallback
 * 2. Versioned values enable safe API races and conflict resolution
 * 3. Writes are fire-and-forget with flush() API for durability
 * 4. Storage layer does NOT talk to network - use Intent system instead
 * 5. Pending sync tracks latest value to prevent lost updates
 *
 * ⚠️ IMPORTANT: SQLite Concurrency
 *
 * OPFS SQLite requires single-writer access to prevent corruption.
 * For multi-tab support, you MUST implement one of:
 * 1. SharedWorker-coordinated access (like Notion)
 * 2. Web Locks API
 * 3. IndexedDB-backed mutex
 *
 * @example
 * ```ts
 * import { offlineStorage } from '@oxlayer/capabilities-state/persist/offline-storage';
 *
 * // Initialize storage
 * await offlineStorage.init();
 *
 * // Simple read (local only)
 * const result = await offlineStorage.getItem<string>('my-key');
 * console.log(result.data, result.source, result.version);
 *
 * // Write (local only - use Intent system for API sync)
 * await offlineStorage.setItem('my-key', { data: 'value' });
 *
 * // Flush pending writes before critical operations
 * await offlineStorage.flush();
 * ```
 */

import type { SqliteAdapter } from '../index';

// ============================================================================
// TYPES
// ============================================================================

export type StorageSource = 'memory' | 'sqlite' | 'local' | 'api';

/**
 * Versioned stored value for safe API races and conflict resolution
 */
export interface StoredValue {
  /** The actual value (JSON stringified) */
  value: string;
  /** Monotonically increasing version per key */
  version: number;
  /** Unix timestamp in milliseconds */
  updatedAt: number;
  /** Where this value came from */
  source: StorageSource;
}

export interface StorageReadResult<T> {
  data: T | null;
  source: StorageSource;
  latency: number;
  version: number | null;
  updatedAt: number | null;
}

export interface StorageWriteOptions {
  /** Skip API sync (write to local only) */
  skipApi?: boolean;
  /** Skip localStorage (write to SQLite only) */
  skipLocal?: boolean;

  /**
   * Custom API sync function
   *
   * NOTE: For better architecture, use the Intent system instead:
   *
   * import { recordIntent } from '@oxlayer/capabilities-state/intent';
   *
   * recordIntent(workspaceId, {
   *   domain: 'storage',
   *   type: 'update',
   *   entityType: 'key',
   *   entityId: key,
   *   payload: value,
   *   policy: IntentPresets.optimistic,
   * });
   *
   * Benefits of using Intent system:
   * - Automatic retry with exponential backoff
   * - Conflict resolution policies
   * - Delivery guarantees
   * - Offline mutation queue
   * - Version checking for stale overwrites
   *
   * @deprecated Use Intent system for API sync instead
   */
  apiSync?: (key: string, value: string, version: number) => Promise<void>;
}

export interface StorageReadOptions<T> {
  /** Race against API call */
  raceWithApi?: boolean;
  /** Custom API fetch function */
  apiFetch?: (key: string) => Promise<StoredValue | null>;
  /** Transform function for API data */
  transform?: (data: unknown) => T;
}

export interface OfflineStorageConfig {
  /** SQLite storage adapter (required) */
  sqlite: SqliteAdapter;
  /** Enable debug logging */
  debug?: boolean;
  /** Minimum delay before localStorage fallback (ms) - gives SQLite head start */
  localStorageFallbackDelay?: number;
}

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

interface CacheEntry {
  value: string;
  version: number;
  updatedAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry>();

  // Returns the value or undefined if not found
  get(key: string): string | undefined {
    return this.cache.get(key)?.value;
  }

  // Get full entry with metadata
  getEntry(key: string): CacheEntry | undefined {
    return this.cache.get(key);
  }

  // Check if key exists (including falsy values like "", "0", "false")
  has(key: string): boolean {
    return this.cache.has(key);
  }

  set(key: string, entry: CacheEntry): void {
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
// PENDING SYNC TRACKING
// ============================================================================

interface PendingSync {
  inFlight: Promise<void>;
  latestValue: string;
  latestVersion: number;
}

// ============================================================================
// OFFLINE STORAGE IMPLEMENTATION
// ============================================================================

class OfflineStorage {
  private memoryCache = new MemoryCache();
  private pendingSyncs = new Map<string, PendingSync>();
  private sqlite: SqliteAdapter;
  private debug: boolean;
  private localStorageFallbackDelay: number;
  private pendingWrites = new Set<Promise<void>>();

  constructor(config: OfflineStorageConfig) {
    this.sqlite = config.sqlite;
    this.debug = config.debug ?? false;
    this.localStorageFallbackDelay = config.localStorageFallbackDelay ?? 10; // 10ms default
  }

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[OfflineStorage]', ...args);
    }
  }

  /**
   * Read a value from storage with SQLite-first hierarchy
   *
   * Storage hierarchy (Decision A: localStorage never beats SQLite):
   * 1. In-memory cache (fastest)
   * 2. SQLite (source of truth - given head start)
   * 3. localStorage (fallback only if SQLite is slow/unavailable)
   * 4. API (optional, with version check)
   */
  async getItem<T = string>(
    key: string,
    options?: StorageReadOptions<T>
  ): Promise<StorageReadResult<T>> {
    const startTime = performance.now();

    // 1. Check in-memory cache first (fastest)
    // Use has() instead of truthy check to handle falsy values like "", "0", "false"
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.getEntry(key)!;
      return {
        data: this.parseJson<T>(entry.value),
        source: 'memory',
        latency: performance.now() - startTime,
        version: entry.version,
        updatedAt: entry.updatedAt,
      };
    }

    // 2. SQLite-first read with head start (Fix Issue 1)
    const localResult = await this.readLocalWithPrecedence(key);

    if (localResult.value) {
      // Update memory cache
      this.memoryCache.set(key, {
        value: localResult.value,
        version: localResult.version,
        updatedAt: localResult.updatedAt,
      });
    }

    // 3. Optionally race with API (with version check - Fix Issue 2)
    if (options?.raceWithApi && options.apiFetch) {
      const apiResult = await this.raceApiRead(key, options.apiFetch, {
        value: localResult.value,
        version: localResult.version,
        updatedAt: localResult.updatedAt,
      });

      if (apiResult !== null) {
        const transformed = options.transform ? options.transform(apiResult.value) : apiResult.value;
        const serialized = JSON.stringify(transformed);

        // Only apply API result if it's fresher (Fix Issue 2 - freshness check)
        if (!localResult.updatedAt || apiResult.updatedAt > localResult.updatedAt) {
          // Update all local caches with fresher API data
          this.memoryCache.set(key, {
            value: serialized,
            version: apiResult.version,
            updatedAt: apiResult.updatedAt,
          });
          this.writeToLocalStorage(key, serialized);
          this.writeToSQLite(key, serialized, apiResult.version, apiResult.updatedAt);

          return {
            data: transformed as T,
            source: 'api',
            latency: performance.now() - startTime,
            version: apiResult.version,
            updatedAt: apiResult.updatedAt,
          };
        } else {
          this.log('API data is stale, ignoring:', {
            key,
            apiUpdatedAt: apiResult.updatedAt,
            localUpdatedAt: localResult.updatedAt,
          });
        }
      }
    }

    // Return local winner
    if (localResult.value) {
      return {
        data: this.parseJson<T>(localResult.value),
        source: localResult.source,
        latency: performance.now() - startTime,
        version: localResult.version,
        updatedAt: localResult.updatedAt,
      };
    }

    // Nothing found
    return {
      data: null,
      source: 'memory',
      latency: performance.now() - startTime,
      version: null,
      updatedAt: null,
    };
  }

  /**
   * SQLite-first read with localStorage as fallback
   *
   * Decision A: localStorage should NEVER beat SQLite
   * - SQLite gets a head start delay
   * - localStorage only wins if SQLite is slow/failed
   */
  private async readLocalWithPrecedence(
    key: string
  ): Promise<{ value: string | null; source: StorageSource; version: number; updatedAt: number }> {
    try {
      // Promise.any returns the first fulfilled promise, ignores rejections
      const result = await Promise.any([
        // SQLite read (async, gets head start)
        this.readFromSQLite(key).then(v => {
          if (v) {
            const stored = this.parseStoredValue(v);
            return { value: stored.value, source: 'sqlite' as StorageSource, version: stored.version, updatedAt: stored.updatedAt };
          }
          throw new Error('No value in SQLite');
        }),
        // localStorage read (delayed fallback - Fix Issue 1)
        new Promise<{ value: string; source: StorageSource; version: number; updatedAt: number }>((resolve, reject) => {
          setTimeout(() => {
            const v = this.readFromLocalStorage(key);
            if (v) {
              const stored = this.parseStoredValue(v);
              resolve({ value: stored.value, source: 'local' as StorageSource, version: stored.version, updatedAt: stored.updatedAt });
            } else {
              reject(new Error('No value in localStorage'));
            }
          }, this.localStorageFallbackDelay);
        }),
      ]);
      return result;
    } catch {
      // All promises rejected = no value found
      return { value: null, source: 'memory', version: 0, updatedAt: 0 };
    }
  }

  /**
   * Proper API race with freshness check (Fix Issue 2)
   * Returns API result only if it's fresher than local, otherwise null
   */
  private async raceApiRead(
    key: string,
    apiFetch: (key: string) => Promise<StoredValue | null>,
    localValue: { value: string | null; version: number; updatedAt: number }
  ): Promise<StoredValue | null> {
    const API_BUDGET_MS = 100; // Maximum time to wait for API

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), API_BUDGET_MS);
      });

      // Race API vs timeout
      const apiResult = await Promise.race([
        apiFetch(key),
        timeoutPromise,
      ]);

      // Return null if timeout or no result
      if (!apiResult) {
        return null;
      }

      // Freshness check (Fix Issue 2) - only accept API data if it's newer
      if (localValue.updatedAt > 0 && apiResult.updatedAt <= localValue.updatedAt) {
        this.log('API data is stale, ignoring:', {
          key,
          apiUpdatedAt: apiResult.updatedAt,
          localUpdatedAt: localValue.updatedAt,
          apiVersion: apiResult.version,
          localVersion: localValue.version,
        });
        return null;
      }

      return apiResult;
    } catch (error) {
      this.log('API fetch failed, using local:', error);
      return null;
    }
  }

  /**
   * Write a value to storage with multi-source strategy
   *
   * Strategy (SQLite as source of truth):
   * 1. Update in-memory cache immediately (sync, for UI)
   * 2. Write to SQLite OPFS immediately (async, persistent - source of truth)
   * 3. Write to localStorage for fast cold start only (sync, boot hint)
   * 4. Sync to API via Intent system (async, background)
   */
  async setItem(key: string, value: unknown, options?: StorageWriteOptions): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const now = Date.now();

    // Get current version for optimistic increment
    const currentEntry = this.memoryCache.getEntry(key);
    const newVersion = (currentEntry?.version ?? 0) + 1;

    // 1. Update in-memory cache immediately (sync)
    this.memoryCache.set(key, {
      value: serialized,
      version: newVersion,
      updatedAt: now,
    });

    // 2. Write to SQLite OPFS immediately (async, but fire first - it's the source of truth)
    const sqliteWrite = this.writeToSQLite(key, serialized, newVersion, now);

    // Track pending write for flush() API (Fix Issue 4)
    this.pendingWrites.add(sqliteWrite);
    sqliteWrite.finally(() => {
      this.pendingWrites.delete(sqliteWrite);
    });

    // 3. Write to localStorage for fast cold start (sync, but after SQLite is queued)
    if (!options?.skipLocal) {
      this.writeToLocalStorage(key, serialized);
    }

    // Don't await SQLite - it writes in background
    sqliteWrite.catch(err => {
      console.warn('[OfflineStorage] SQLite write failed (data may be lost on refresh):', err);
    });

    // 4. Sync to API via Intent system (async, background) - don't await
    if (!options?.skipApi && options?.apiSync) {
      this.syncToApi(key, serialized, newVersion, options.apiSync);
    }
  }

  /**
   * Remove a value from all storage sources
   */
  async removeItem(key: string, options?: StorageWriteOptions): Promise<void> {
    // 1. Remove from in-memory cache (sync)
    this.memoryCache.delete(key);

    // 2. Remove from localStorage (sync)
    if (!options?.skipLocal) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore localStorage errors
      }
    }

    // 3. Remove from SQLite (async)
    const sqliteDelete = this.sqlite.removeItem(key);
    this.pendingWrites.add(sqliteDelete);
    sqliteDelete.finally(() => {
      this.pendingWrites.delete(sqliteDelete);
    });
    sqliteDelete.catch(error => {
      console.warn('[OfflineStorage] Failed to remove from SQLite:', error);
    });

    // 4. Sync deletion to API (async, background)
    if (!options?.skipApi && options?.apiSync) {
      // For deletion, we pass empty string to indicate delete
      this.syncToApi(key, '', 0, options.apiSync);
    }
  }

  /**
   * Get all keys from storage
   */
  async getAllKeys(): Promise<string[]> {
    // Try SQLite first, fall back to localStorage
    try {
      if (this.sqlite.getAllKeys) {
        const sqliteKeys = await this.sqlite.getAllKeys();
        if (sqliteKeys.length > 0) {
          return sqliteKeys;
        }
      }
    } catch {
      // Fall through to localStorage
    }

    // Fallback to localStorage
    try {
      const localKeys = Object.keys(localStorage);
      return localKeys;
    } catch {
      return [];
    }
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    // Clear in-memory cache
    this.memoryCache.clear();

    // Clear localStorage
    try {
      localStorage.clear();
    } catch {
      // Ignore
    }

    // Clear SQLite
    try {
      if (this.sqlite.clear) {
        await this.sqlite.clear();
      }
    } catch (error) {
      console.warn('[OfflineStorage] Failed to clear SQLite:', error);
    }
  }

  /**
   * Check if storage is ready
   */
  isReady(): boolean {
    // Assume ready if we have a sqlite adapter
    return true;
  }

  /**
   * Initialize storage
   */
  async init(): Promise<void> {
    // SQLite adapter should be initialized separately
    // This is a no-op but kept for interface compatibility
  }

  /**
   * Flush pending writes to ensure durability
   *
   * Use this before:
   * - Logout
   * - Export
   * - App close
   * - Tests
   *
   * (Fix Issue 4 - durability signal)
   */
  async flush(): Promise<void> {
    // Wait for all pending SQLite writes
    await Promise.all(Array.from(this.pendingWrites));
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private async readFromSQLite(key: string): Promise<string | null> {
    try {
      return await this.sqlite.getItem(key);
    } catch {
      return null;
    }
  }

  private readFromLocalStorage(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeToLocalStorage(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('[OfflineStorage] Failed to write to localStorage:', error);
    }
  }

  private async writeToSQLite(key: string, value: string, version: number, updatedAt: number): Promise<void> {
    try {
      const storedValue: StoredValue = {
        value,
        version,
        updatedAt,
        source: 'sqlite',
      };
      await this.sqlite.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn('[OfflineStorage] Failed to write to SQLite:', error);
      throw error;
    }
  }

  /**
   * Sync to API with latest value tracking (Fix Issue 3)
   *
   * If multiple updates happen while a sync is in flight,
   * we track the latest value and sync it after the current one finishes.
   */
  private syncToApi(
    key: string,
    value: string,
    version: number,
    apiSync: (key: string, value: string, version: number) => Promise<void>
  ): void {
    const existingSync = this.pendingSyncs.get(key);

    if (existingSync) {
      // Update latest value - will sync after current finishes
      this.log('[OfflineStorage] Sync in progress, queuing latest value:', key);
      existingSync.latestValue = value;
      existingSync.latestVersion = version;
      return;
    }

    const syncPromise = (async () => {
      try {
        // Sync current value
        await apiSync(key, value, version);

        // Check if a newer value came in while we were syncing
        const pending = this.pendingSyncs.get(key);
        if (pending && pending.latestVersion > version) {
          this.log('[OfflineStorage] Newer value detected, re-syncing:', key);
          // Re-sync with the latest value
          await apiSync(key, pending.latestValue, pending.latestVersion);
          pending.latestValue = '';
          pending.latestVersion = 0;
        }
      } catch (error) {
        console.warn('[OfflineStorage] API sync failed for key:', key, error);
        // Don't throw - local write is already successful
      } finally {
        // Only remove if no newer value is pending
        const pending = this.pendingSyncs.get(key);
        if (pending && pending.latestVersion === 0) {
          this.pendingSyncs.delete(key);
        }
      }
    })();

    this.pendingSyncs.set(key, {
      inFlight: syncPromise,
      latestValue: '',
      latestVersion: 0,
    });

    // Don't await - this runs in background
  }

  private parseJson<T>(value: string | null): T | null {
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  /**
   * Parse a StoredValue from storage
   * Handles legacy values (plain strings) for backward compatibility
   */
  private parseStoredValue(raw: string | null): StoredValue {
    if (!raw) {
      return { value: '', version: 0, updatedAt: 0, source: 'local' };
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
        return parsed as StoredValue;
      }
    } catch {
      // Not JSON, treat as legacy plain value
    }

    // Legacy value - wrap it with default metadata
    return {
      value: raw,
      version: 1,
      updatedAt: Date.now(),
      source: 'local',
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE (lazy initialization)
// ============================================================================

let offlineStorageInstance: OfflineStorage | null = null;

/**
 * Get or create the offline storage singleton
 */
export function getOfflineStorage(config: OfflineStorageConfig): OfflineStorage {
  if (!offlineStorageInstance) {
    offlineStorageInstance = new OfflineStorage(config);
  }
  return offlineStorageInstance;
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Get a value from storage with SQLite-first hierarchy
 */
export async function getItem<T = string>(
  config: OfflineStorageConfig,
  key: string,
  options?: StorageReadOptions<T>
): Promise<T | null> {
  const storage = getOfflineStorage(config);
  const result = await storage.getItem<T>(key, options);
  return result.data;
}

/**
 * Set a value in storage with multi-source persistence
 */
export async function setItem(
  config: OfflineStorageConfig,
  key: string,
  value: unknown,
  options?: StorageWriteOptions
): Promise<void> {
  const storage = getOfflineStorage(config);
  return storage.setItem(key, value, options);
}

/**
 * Remove a value from all storage sources
 */
export async function removeItem(
  config: OfflineStorageConfig,
  key: string,
  options?: StorageWriteOptions
): Promise<void> {
  const storage = getOfflineStorage(config);
  return storage.removeItem(key, options);
}

/**
 * Get all keys from storage
 */
export async function getAllKeys(config: OfflineStorageConfig): Promise<string[]> {
  const storage = getOfflineStorage(config);
  return storage.getAllKeys();
}

/**
 * Clear all storage
 */
export async function clearStorage(config: OfflineStorageConfig): Promise<void> {
  const storage = getOfflineStorage(config);
  return storage.clear();
}

/**
 * Initialize offline storage
 */
export async function initStorage(config: OfflineStorageConfig): Promise<void> {
  const storage = getOfflineStorage(config);
  return storage.init();
}

/**
 * Flush pending writes for durability
 */
export async function flushStorage(config: OfflineStorageConfig): Promise<void> {
  const storage = getOfflineStorage(config);
  return storage.flush();
}
