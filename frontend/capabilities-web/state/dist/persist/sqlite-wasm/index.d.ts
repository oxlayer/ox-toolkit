export { SharedSQLiteAdapter, getAutoSqliteStorage, isSharedWorkerSupported, sharedSqliteStorage } from './shared-adapter.js';

/**
 * @oxlayer/capabilities-state/persist/sqlite-wasm
 *
 * SQLite WASM storage adapter for web applications using OPFS (Origin Private File System).
 *
 * This module provides a persistent SQLite database running in the browser via WebAssembly.
 * It uses the official @sqlite.org/sqlite-wasm package with OPFS for persistent storage.
 *
 * Features:
 * - OPFS-based persistent SQLite database
 * - Worker-based architecture for better performance
 * - Automatic fallback to in-memory database if OPFS is unavailable
 * - Implements the SqliteAdapter interface for use with Legend-State persist
 *
 * Architecture Note (Multi-Tab Concurrency):
 *
 * OPFS SQLite requires single-writer access to prevent database corruption.
 * This implementation does NOT handle multi-tab coordination.
 *
 * For multi-tab support, you MUST implement one of:
 * 1. SharedWorker-coordinated access (like Notion)
 * 2. Web Locks API
 * 3. IndexedDB-backed mutex
 *
 * @example
 * ```ts
 * import { sqliteStorage, createSqliteAdapter } from '@oxlayer/capabilities-state/persist/sqlite-wasm';
 *
 * // Initialize SQLite WASM
 * await sqliteStorage.init();
 *
 * // Use directly
 * await sqliteStorage.setItem('my-key', JSON.stringify({ data: 'value' }));
 * const value = await sqliteStorage.getItem('my-key');
 *
 * // Or use as a Legend-State persist adapter
 * const adapter = createSqliteAdapter(sqliteStorage);
 * ```
 */
interface SQLiteWasmConfig {
    /** Database filename (use OPFS vfs for persistence) */
    filename?: string;
    /** Enable debug logging */
    debug?: boolean;
}
interface SQLiteStorageAdapter {
    init(): Promise<void>;
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    getAllKeys(): Promise<string[]>;
    clear(): Promise<void>;
    isReady(): boolean;
}
/**
 * SQLite WASM storage singleton
 *
 * Implements a key-value storage interface on top of SQLite.
 * Can be used directly or as a Legend-State persist adapter.
 */
declare const sqliteStorage: SQLiteStorageAdapter;
/**
 * Create a Legend-State persist adapter from SQLite WASM storage
 *
 * This creates an adapter that can be used with Legend-State's observablePersist.
 *
 * @param storage - The SQLite storage instance (defaults to sqliteStorage)
 * @returns A Legend-State persist adapter
 *
 * @example
 * ```ts
 * import { observable } from '@legendapp/state';
 * import { createSqliteWasmAdapter } from '@oxlayer/capabilities-state/persist/sqlite-wasm';
 *
 * const state = observable({ data: 'value' });
 * const adapter = createSqliteWasmAdapter();
 *
 * observablePersist(state, {
 *   persist: adapter,
 *   local: 'my-app-state',
 * });
 * ```
 */
declare function createSqliteWasmAdapter(storage?: SQLiteStorageAdapter): {
    get: (key: string) => Promise<any>;
    set: (key: string, value: unknown) => Promise<void>;
    delete: (key: string) => Promise<void>;
};
/**
 * @deprecated Use createSqliteWasmAdapter instead
 */
declare function createSqliteAdapter(adapter: SQLiteStorageAdapter): {
    get: (key: string) => Promise<any>;
    set: (key: string, value: unknown) => Promise<void>;
    delete: (key: string) => Promise<void>;
};

export { type SQLiteStorageAdapter, type SQLiteWasmConfig, createSqliteAdapter, createSqliteWasmAdapter, sqliteStorage };
