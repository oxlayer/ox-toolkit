/**
 * @oxlayer/capabilities-state/persist/sqlite-wasm
 *
 * SharedWorker SQLite Adapter (Notion-style multi-tab coordination)
 *
 * Main-thread adapter that coordinates with SharedWorker to guarantee
 * single-writer SQLite access across tabs.
 *
 * This adapter is completely unaware of multi-tab complexity - the
 * SharedWorker handles all coordination transparently.
 *
 * Architecture:
 * ┌─────────────────┐    ┌────────────────────┐
 * │   Main Thread   │────▶│   SharedWorker     │
 * │  (this adapter) │    │   (Coordinator)    │
 * └─────────────────┘    └────────────────────┘
 *                                │
 *                                ▼
 *                       ┌─────────────────┐
 *                       │  Active Tab     │
 *                       │  SQLite Worker  │
 *                       └─────────────────┘
 *
 * Features:
 * - Single-writer guarantee (no OPFS corruption)
 * - Multi-tab support (all tabs can read/write)
 * - Automatic failover (new active tab promoted on disconnect)
 * - Transparent to application (same API as regular sqliteStorage)
 *
 * @example
 * ```ts
 * import { sharedSqliteStorage } from '@oxlayer/capabilities-state/persist/sqlite-wasm';
 *
 * // Initialize (starts SharedWorker and per-tab worker)
 * await sharedSqliteStorage.init();
 *
 * // Use same API as regular storage
 * await sharedSqliteStorage.setItem('my-key', 'my-value');
 * const value = await sharedSqliteStorage.getItem('my-key');
 * ```
 */
interface SharedSQLiteAdapter {
    init(): Promise<void>;
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    getAllKeys(): Promise<string[]>;
    clear(): Promise<void>;
    isReady(): boolean;
}
/**
 * SharedWorker SQLite storage singleton
 *
 * Provides the same API as sqliteStorage but with multi-tab coordination.
 */
declare const sharedSqliteStorage: SharedSQLiteAdapter;
/**
 * Check if SharedWorker is supported
 */
declare function isSharedWorkerSupported(): boolean;
/**
 * Get the appropriate storage adapter
 *
 * Returns sharedSqliteStorage if SharedWorker is supported (multi-tab),
 * otherwise falls back to regular sqliteStorage (single-tab).
 */
declare function getAutoSqliteStorage(): Promise<SharedSQLiteAdapter>;

export { type SharedSQLiteAdapter, getAutoSqliteStorage, isSharedWorkerSupported, sharedSqliteStorage };
