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

// @ts-ignore - @sqlite.org/sqlite-wasm is a peer dependency
import { sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm';

// ============================================================================
// TYPES
// ============================================================================

export interface SQLiteWasmConfig {
  /** Database filename (use OPFS vfs for persistence) */
  filename?: string;
  /** Enable debug logging */
  debug?: boolean;
}

export interface SQLiteStorageAdapter {
  init(): Promise<void>;
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
  clear(): Promise<void>;
  isReady(): boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: SQLiteWasmConfig = {
  // Use OPFS for persistent SQLite database
  // Falls back to in-memory if OPFS is not available
  filename: 'file:oxlayer-db?vfs=opfs',
  debug: false,
};

// ============================================================================
// INTERNAL STATE
// ============================================================================

let initPromise: Promise<void> | null = null;
let workerPromiser: any = null;
let databaseId: number | null = null;
let config = DEFAULT_CONFIG;

// ============================================================================
// LOGGING
// ============================================================================

function log(...args: unknown[]): void {
  if (config.debug) {
    console.log('[SQLiteWasm]', ...args);
  }
}

function logError(...args: unknown[]): void {
  console.error('[SQLiteWasm]', ...args);
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * Initialize SQLite WASM with OPFS support
 */
async function initSQLite(customConfig?: SQLiteWasmConfig): Promise<void> {
  if (workerPromiser) {
    log('Already initialized, skipping');
    return;
  }
  if (initPromise) {
    log('Initialization already in progress, waiting...');
    return initPromise;
  }

  config = { ...DEFAULT_CONFIG, ...customConfig };

  log('Creating initialization promise...');

  initPromise = (async () => {
    try {
      log('Initializing SQLite WASM...');

      // The exported sqlite3Worker1Promiser is v2 which returns a Promise
      // that resolves to the promiser function
      const promiser = await (sqlite3Worker1Promiser as any)({
        onerror: (error: unknown) => {
          logError('Worker error:', error);
        },
      });

      log('sqlite3Worker1Promiser resolved, workerPromiser type:', typeof promiser);

      // Check if workerPromiser is a function
      if (typeof promiser !== 'function') {
        throw new Error(`workerPromiser is not a function, it's a ${typeof promiser}`);
      }

      workerPromiser = promiser;
      log('Promiser stored, initializing database...');

      await initializeDatabase(workerPromiser);
      log('Database initialized successfully');

    } catch (err) {
      logError('Failed to initialize:', err);
      throw err;
    }
  })();

  return initPromise;
}

/**
 * Initialize database schema
 */
async function initializeDatabase(workerFunc: any): Promise<void> {
  log('initializeDatabase called, workerFunc type:', typeof workerFunc);

  // Check if workerFunc is callable
  if (typeof workerFunc !== 'function') {
    logError('workerFunc is not a function!', typeof workerFunc, workerFunc);
    throw new Error(`workerFunc is not a function, it's a ${typeof workerFunc}`);
  }

  // Get config to verify SQLite is working
  try {
    const configResponse = await workerFunc('config-get', {});
    log('config response:', configResponse);
    log('SQLite version:', configResponse.result?.version?.libVersion);
  } catch (err) {
    logError('config-get error:', err);
  }

  // Try opening with OPFS first, fall back to in-memory
  const dbOptions = [
    config.filename!,  // Try OPFS first
    ':memory:',       // Fall back to in-memory
  ];

  for (const filename of dbOptions) {
    log('Trying to open database with filename:', filename);
    try {
      const openResponse = await workerFunc('open', { filename });
      log('open response:', openResponse);

      if (!openResponse.result) {
        log('open returned no result for', filename);
        continue;
      }

      databaseId = openResponse.result.dbId;
      log('Successfully opened database with dbId:', databaseId, 'filename:', filename);
      break;
    } catch (err: unknown) {
      // Error responses from the worker are thrown as the error object
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      log('open failed for', filename, ':', errorMessage);
      // Try next option
    }
  }

  if (databaseId === null) {
    throw new Error('Failed to open database with any option');
  }

  // Create key-value storage table
  await workerFunc('exec', {
    dbId: databaseId,
    sql: `
      CREATE TABLE IF NOT EXISTS storage (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE INDEX IF NOT EXISTS idx_storage_key ON storage(key);
    `,
  });

  log('Schema initialized, dbId:', databaseId);
}

/**
 * Get the worker promiser (initializes if needed)
 */
async function getWorker(): Promise<any> {
  if (!workerPromiser) {
    await initSQLite();
  }
  return workerPromiser;
}

/**
 * Get the database ID
 */
async function getDatabaseId(): Promise<number> {
  if (databaseId === null) {
    await initSQLite();
  }
  return databaseId!;
}

// ============================================================================
// PUBLIC API - SQLite Storage Adapter
// ============================================================================

/**
 * SQLite WASM storage singleton
 *
 * Implements a key-value storage interface on top of SQLite.
 * Can be used directly or as a Legend-State persist adapter.
 */
export const sqliteStorage: SQLiteStorageAdapter = {
  /**
   * Initialize SQLite WASM
   */
  async init(customConfig?: SQLiteWasmConfig): Promise<void> {
    return initSQLite(customConfig);
  },

  /**
   * Get a value from storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const workerFunc = await getWorker();
      const db = await getDatabaseId();

      const result = await workerFunc('exec', {
        dbId: db,
        sql: 'SELECT value FROM storage WHERE key = ? LIMIT 1',
        bind: [key],
        rowMode: 'object',
        returnValue: 'resultRows',
      });

      // Check if result has rows and return the value
      if (result && result.result && Array.isArray(result.result) && result.result.length > 0) {
        const row = result.result[0] as { value: string };
        return row.value;
      }

      return null;
    } catch (err) {
      logError('getItem error:', err);
      return null;
    }
  },

  /**
   * Set a value in storage
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      const workerFunc = await getWorker();
      const db = await getDatabaseId();

      // Use UPSERT (INSERT OR REPLACE)
      await workerFunc('exec', {
        dbId: db,
        sql: `
          INSERT INTO storage (key, value, updated_at)
          VALUES (?, ?, strftime('%s', 'now'))
          ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = strftime('%s', 'now')
        `,
        bind: [key, value],
      });

      log('setItem success for key:', key);
    } catch (err) {
      logError('setItem error:', err);
      throw err;
    }
  },

  /**
   * Remove a value from storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      const workerFunc = await getWorker();
      const db = await getDatabaseId();

      await workerFunc('exec', {
        dbId: db,
        sql: 'DELETE FROM storage WHERE key = ?',
        bind: [key],
      });
    } catch (err) {
      logError('removeItem error:', err);
      throw err;
    }
  },

  /**
   * Get all keys from storage
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const workerFunc = await getWorker();
      const db = await getDatabaseId();

      const result = await workerFunc('exec', {
        dbId: db,
        sql: 'SELECT key FROM storage ORDER BY key',
        rowMode: 'object',
        returnValue: 'resultRows',
      });

      if (result && result.result && Array.isArray(result.result)) {
        return result.result.map((row: any) => row.key);
      }

      return [];
    } catch (err) {
      logError('getAllKeys error:', err);
      return [];
    }
  },

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    try {
      const workerFunc = await getWorker();
      const db = await getDatabaseId();

      await workerFunc('exec', {
        dbId: db,
        sql: 'DELETE FROM storage',
      });
    } catch (err) {
      logError('clear error:', err);
      throw err;
    }
  },

  /**
   * Check if SQLite is ready
   */
  isReady(): boolean {
    return workerPromiser !== null;
  },
};

// ============================================================================
// LEGEND-STATE ADAPTER FACTORY
// ============================================================================

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
export function createSqliteWasmAdapter(storage: SQLiteStorageAdapter = sqliteStorage) {
  return {
    get: async (key: string) => {
      const value = await storage.getItem(key);
      if (!value) return undefined;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    },
    set: async (key: string, value: unknown) => {
      await storage.setItem(key, JSON.stringify(value));
    },
    delete: async (key: string) => {
      await storage.removeItem(key);
    },
  };
}

// ============================================================================
// RE-EXPORT LEGACY ADAPTER
// ============================================================================

/**
 * @deprecated Use createSqliteWasmAdapter instead
 */
export function createSqliteAdapter(adapter: SQLiteStorageAdapter) {
  return createSqliteWasmAdapter(adapter);
}

// ============================================================================
// SHAREDWORKER MULTI-TAB ADAPTER (Notion-style)
// ============================================================================

/**
 * Re-export SharedWorker adapter for multi-tab SQLite coordination
 *
 * This provides single-writer guarantee across multiple browser tabs,
 * preventing OPFS corruption while allowing concurrent access.
 *
 * @example
 * ```ts
 * import { sharedSqliteStorage, isSharedWorkerSupported } from '@oxlayer/capabilities-state/persist/sqlite-wasm';
 *
 * if (isSharedWorkerSupported()) {
 *   await sharedSqliteStorage.init();
 *   await sharedSqliteStorage.setItem('key', 'value');
 * } else {
 *   // Fall back to regular sqliteStorage for single-tab usage
 *   await sqliteStorage.init();
 * }
 * ```
 */
export {
  sharedSqliteStorage,
  isSharedWorkerSupported,
  getAutoSqliteStorage,
  type SharedSQLiteAdapter,
} from './shared-adapter';
