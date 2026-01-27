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

// Re-export SQLite WASM module
export {
  sqliteStorage,
  createSqliteWasmAdapter,
  type SQLiteStorageAdapter,
  type SQLiteWasmConfig,
} from './sqlite-wasm';

// Re-export offline storage module
export {
  getOfflineStorage,
  type OfflineStorageConfig,
  type StorageReadResult,
  type StorageReadOptions,
  type StorageWriteOptions,
  type StorageSource,
} from './offline-storage';

// Legacy exports
/**
 * @deprecated Use Legend-State's built-in ObservablePersistLocalStorage instead
 */
export function createLocalStorageAdapter(name: string) {
  return {
    name,
    get: () => {
      const item = localStorage.getItem(name);
      return item ? JSON.parse(item) : undefined;
    },
    set: (value: unknown) => {
      localStorage.setItem(name, JSON.stringify(value));
    },
    delete: () => {
      localStorage.removeItem(name);
    },
  };
}

/**
 * SQLite adapter interface
 *
 * This interface is implemented by SQLite WASM and other SQLite adapters.
 */
export interface SqliteAdapter {
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
export function createSqliteAdapter(adapter: SqliteAdapter) {
  return {
    get: async (key: string) => {
      const value = await adapter.getItem(key);
      if (!value) return undefined;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    },
    set: async (key: string, value: unknown) => {
      await adapter.setItem(key, JSON.stringify(value));
    },
    delete: async (key: string) => {
      await adapter.removeItem(key);
    },
  };
}

// ============================================================================
// PURE STORAGE (Intent-Native Persistence)
// ============================================================================

/**
 * Pure Storage - Intent-Native Persistence Layer
 *
 * Clean persistence that stores locally and lets Intent system handle sync.
 *
 * @example
 * ```ts
 * import { getPureStorage, recordIntent } from '@oxlayer/capabilities-state';
 *
 * const storage = getPureStorage({ sqlite: sqliteStorage });
 *
 * // Store locally
 * const stored = await storage.set('my-key', { data: 'value' });
 *
 * // Sync to API via Intent system
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
export {
  getPureStorage,
  getStoredValue,
  setStoredValue,
  deleteStoredValue,
  getStoredKeys,
  clearStoredValues,
  flushStorage,
  type StoredValue,
  type StoredResult,
  type PureStorageConfig,
} from './pure-storage';
