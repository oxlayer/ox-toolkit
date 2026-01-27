import './persist/sqlite-wasm/index.js';

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

type StorageSource = 'memory' | 'sqlite' | 'local' | 'api';
/**
 * Versioned stored value for safe API races and conflict resolution
 */
interface StoredValue$1 {
    /** The actual value (JSON stringified) */
    value: string;
    /** Monotonically increasing version per key */
    version: number;
    /** Unix timestamp in milliseconds */
    updatedAt: number;
    /** Where this value came from */
    source: StorageSource;
}
interface StorageReadResult<T> {
    data: T | null;
    source: StorageSource;
    latency: number;
    version: number | null;
    updatedAt: number | null;
}
interface StorageWriteOptions {
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
interface StorageReadOptions<T> {
    /** Race against API call */
    raceWithApi?: boolean;
    /** Custom API fetch function */
    apiFetch?: (key: string) => Promise<StoredValue$1 | null>;
    /** Transform function for API data */
    transform?: (data: unknown) => T;
}
interface OfflineStorageConfig {
    /** SQLite storage adapter (required) */
    sqlite: SqliteAdapter;
    /** Enable debug logging */
    debug?: boolean;
    /** Minimum delay before localStorage fallback (ms) - gives SQLite head start */
    localStorageFallbackDelay?: number;
}
declare class OfflineStorage {
    private memoryCache;
    private pendingSyncs;
    private sqlite;
    private debug;
    private localStorageFallbackDelay;
    private pendingWrites;
    constructor(config: OfflineStorageConfig);
    private log;
    /**
     * Read a value from storage with SQLite-first hierarchy
     *
     * Storage hierarchy (Decision A: localStorage never beats SQLite):
     * 1. In-memory cache (fastest)
     * 2. SQLite (source of truth - given head start)
     * 3. localStorage (fallback only if SQLite is slow/unavailable)
     * 4. API (optional, with version check)
     */
    getItem<T = string>(key: string, options?: StorageReadOptions<T>): Promise<StorageReadResult<T>>;
    /**
     * SQLite-first read with localStorage as fallback
     *
     * Decision A: localStorage should NEVER beat SQLite
     * - SQLite gets a head start delay
     * - localStorage only wins if SQLite is slow/failed
     */
    private readLocalWithPrecedence;
    /**
     * Proper API race with freshness check (Fix Issue 2)
     * Returns API result only if it's fresher than local, otherwise null
     */
    private raceApiRead;
    /**
     * Write a value to storage with multi-source strategy
     *
     * Strategy (SQLite as source of truth):
     * 1. Update in-memory cache immediately (sync, for UI)
     * 2. Write to SQLite OPFS immediately (async, persistent - source of truth)
     * 3. Write to localStorage for fast cold start only (sync, boot hint)
     * 4. Sync to API via Intent system (async, background)
     */
    setItem(key: string, value: unknown, options?: StorageWriteOptions): Promise<void>;
    /**
     * Remove a value from all storage sources
     */
    removeItem(key: string, options?: StorageWriteOptions): Promise<void>;
    /**
     * Get all keys from storage
     */
    getAllKeys(): Promise<string[]>;
    /**
     * Clear all storage
     */
    clear(): Promise<void>;
    /**
     * Check if storage is ready
     */
    isReady(): boolean;
    /**
     * Initialize storage
     */
    init(): Promise<void>;
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
    flush(): Promise<void>;
    private readFromSQLite;
    private readFromLocalStorage;
    private writeToLocalStorage;
    private writeToSQLite;
    /**
     * Sync to API with latest value tracking (Fix Issue 3)
     *
     * If multiple updates happen while a sync is in flight,
     * we track the latest value and sync it after the current one finishes.
     */
    private syncToApi;
    private parseJson;
    /**
     * Parse a StoredValue from storage
     * Handles legacy values (plain strings) for backward compatibility
     */
    private parseStoredValue;
}
/**
 * Get or create the offline storage singleton
 */
declare function getOfflineStorage(config: OfflineStorageConfig): OfflineStorage;
/**
 * Get a value from storage with SQLite-first hierarchy
 */
declare function getItem<T = string>(config: OfflineStorageConfig, key: string, options?: StorageReadOptions<T>): Promise<T | null>;
/**
 * Set a value in storage with multi-source persistence
 */
declare function setItem(config: OfflineStorageConfig, key: string, value: unknown, options?: StorageWriteOptions): Promise<void>;
/**
 * Remove a value from all storage sources
 */
declare function removeItem(config: OfflineStorageConfig, key: string, options?: StorageWriteOptions): Promise<void>;
/**
 * Get all keys from storage
 */
declare function getAllKeys(config: OfflineStorageConfig): Promise<string[]>;
/**
 * Clear all storage
 */
declare function clearStorage(config: OfflineStorageConfig): Promise<void>;
/**
 * Initialize offline storage
 */
declare function initStorage(config: OfflineStorageConfig): Promise<void>;
/**
 * Flush pending writes for durability
 */
declare function flushStorage$1(config: OfflineStorageConfig): Promise<void>;

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

/**
 * Versioned stored value for safe API races and conflict resolution
 */
interface StoredValue<T = unknown> {
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
interface StoredResult<T = unknown> {
    data: T | null;
    version: number;
    updatedAt: number;
    source: 'memory' | 'sqlite';
}
/**
 * Pure storage configuration
 */
interface PureStorageConfig {
    /** SQLite storage adapter */
    sqlite: SqliteAdapter;
    /** Enable debug logging */
    debug?: boolean;
    /** Memory cache size limit (0 = unlimited) */
    cacheSizeLimit?: number;
}
declare class PureStorage {
    private memoryCache;
    private sqlite;
    private debug;
    private pendingWrites;
    constructor(config: PureStorageConfig);
    private log;
    /**
     * Get a value from storage with metadata
     *
     * Strategy:
     * 1. Check memory cache (fastest)
     * 2. Check SQLite (persistent)
     *
     * Returns StoredResult with version/updatedAt for Intent system
     */
    get<T = unknown>(key: string): Promise<StoredResult<T>>;
    /**
     * Set a value in storage
     *
     * Strategy:
     * 1. Update memory cache immediately (sync)
     * 2. Write to SQLite (async, fire-and-forget)
     *
     * Returns version info for Intent system to use in API sync
     */
    set<T = unknown>(key: string, value: T): Promise<StoredValue<T>>;
    /**
     * Delete a value from storage
     */
    delete(key: string): Promise<void>;
    /**
     * Get all keys from storage
     */
    keys(): Promise<string[]>;
    /**
     * Clear all storage
     */
    clear(): Promise<void>;
    /**
     * Flush pending writes to ensure durability
     *
     * Use before:
     * - Logout
     * - Export
     * - App close
     * - Tests
     */
    flush(): Promise<void>;
    private writeToSQLite;
    private parseStoredValue;
}
/**
 * Get or create the pure storage singleton
 */
declare function getPureStorage(config: PureStorageConfig): PureStorage;
/**
 * Get a value from storage with metadata
 */
declare function getStoredValue<T = unknown>(config: PureStorageConfig, key: string): Promise<StoredResult<T>>;
/**
 * Set a value in storage
 */
declare function setStoredValue<T = unknown>(config: PureStorageConfig, key: string, value: T): Promise<StoredValue<T>>;
/**
 * Delete a value from storage
 */
declare function deleteStoredValue(config: PureStorageConfig, key: string): Promise<void>;
/**
 * Get all keys from storage
 */
declare function getStoredKeys(config: PureStorageConfig): Promise<string[]>;
/**
 * Clear all storage
 */
declare function clearStoredValues(config: PureStorageConfig): Promise<void>;
/**
 * Flush pending writes for durability
 */
declare function flushStorage(config: PureStorageConfig): Promise<void>;

/**
 * @oxlayer/capabilities-state/persist
 *
 * Persistence adapters for Legend-State.
 *
 * This module provides custom persistence adapters for different storage backends.
 *
 * Available adapters:
 * - localStorage: Simple browser storage
 * - SQLite WASM: Web-based SQLite with OPFS for persistence
 * - Offline storage: Multi-source storage layer with race-based reads
 *
 * @example
 * ```ts
 * import { sqliteStorage, createSqliteWasmAdapter } from '@oxlayer/capabilities-state/persist/sqlite-wasm';
 * import { getOfflineStorage } from '@oxlayer/capabilities-state/persist/offline-storage';
 *
 * // Use SQLite WASM directly
 * await sqliteStorage.init();
 * await sqliteStorage.setItem('my-key', JSON.stringify({ data: 'value' }));
 *
 * // Use offline storage with multi-source strategy
 * const storage = getOfflineStorage({ sqlite: sqliteStorage });
 * await storage.setItem('my-key', { data: 'value' });
 * ```
 */

/**
 * @deprecated Use Legend-State's built-in ObservablePersistLocalStorage instead
 */
declare function createLocalStorageAdapter(name: string): {
    name: string;
    get: () => any;
    set: (value: unknown) => void;
    delete: () => void;
};
/**
 * SQLite adapter interface
 *
 * This interface is implemented by SQLite WASM and other SQLite adapters.
 */
interface SqliteAdapter {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
    getAllKeys?: () => Promise<string[]>;
    clear?: () => Promise<void>;
    isReady?: () => boolean;
}
/**
 * @deprecated Use createSqliteWasmAdapter instead
 */
declare function createSqliteAdapter(adapter: SqliteAdapter): {
    get: (key: string) => Promise<any>;
    set: (key: string, value: unknown) => Promise<void>;
    delete: (key: string) => Promise<void>;
};

export { type OfflineStorageConfig as O, type PureStorageConfig as P, type SqliteAdapter as S, type StorageReadOptions as a, type StorageReadResult as b, type StorageSource as c, type StorageWriteOptions as d, type StoredResult as e, type StoredValue as f, clearStorage as g, clearStoredValues as h, createLocalStorageAdapter as i, createSqliteAdapter as j, deleteStoredValue as k, flushStorage as l, getOfflineStorage as m, getAllKeys as n, getItem as o, getPureStorage as p, getStoredKeys as q, getStoredValue as r, initStorage as s, removeItem as t, setItem as u, setStoredValue as v, type StoredValue$1 as w, flushStorage$1 as x };
