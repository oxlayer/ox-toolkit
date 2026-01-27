/**
 * @oxlayer/capabilities-state/persist/sqlite-wasm/workers
 *
 * Dedicated SQLite Worker (per tab)
 *
 * Responsibilities:
 * - Own the SQLite connection (if this tab is active)
 * - Execute queries when active
 * - Return results to SharedWorker coordinator
 * - Handle graceful deactivation when another tab takes over
 *
 * Only the "active" tab's worker actually touches SQLite.
 * Other workers remain idle but ready to take over.
 *
 * @example
 * ```ts
 * const worker = new Worker(
 *   new URL('./sqlite-worker.ts', import.meta.url),
 *   { type: 'module' }
 * );
 * ```
 */

// @ts-ignore - @sqlite.org/sqlite-wasm is a peer dependency
import { sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm';

// ============================================================================
// TYPES
// ============================================================================

interface CoordinatorMessage {
  type: 'set-active' | 'sqlite-query';
  active?: boolean;
  method?: 'getItem' | 'setItem' | 'removeItem' | 'getAllKeys' | 'clear' | 'init';
  key?: string;
  value?: string;
  replyTo?: string;
}

interface WorkerMessage {
  type: 'worker-ready' | 'sqlite-query' | 'sqlite-result';
  query?: {
    method: 'getItem' | 'setItem' | 'removeItem' | 'getAllKeys' | 'clear' | 'init';
    key?: string;
    value?: string;
  };
  result?: unknown;
  error?: string;
  replyTo?: string;
}

// ============================================================================
// STATE
// ============================================================================

let isActive = false;
let workerPromiser: any = null;
let databaseId: number | null = null;
let coordinatorPort: MessagePort | null = null;
let initPromise: Promise<void> | null = null;

// ============================================================================
// CONFIGURATION
// ============================================================================

const DB_FILENAME = 'file:oxlayer-db?vfs=opfs';

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize SQLite WASM with OPFS support
 */
async function initSQLite(): Promise<void> {
  if (workerPromiser) {
    return; // Already initialized
  }

  if (initPromise) {
    return initPromise; // Initialization in progress
  }

  initPromise = (async () => {
    try {
      console.log('[SQLiteWorker] Initializing SQLite WASM...');

      // Get the promiser
      const promiser = await (sqlite3Worker1Promiser as any)({
        onerror: (error: unknown) => {
          console.error('[SQLiteWorker] Worker error:', error);
        },
      });

      workerPromiser = promiser;
      console.log('[SQLiteWorker] Promiser ready');

      // Open database
      await initializeDatabase(promiser);
      console.log('[SQLiteWorker] Database initialized:', databaseId);
    } catch (err) {
      console.error('[SQLiteWorker] Failed to initialize:', err);
      throw err;
    }
  })();

  return initPromise;
}

/**
 * Initialize database and create schema
 */
async function initializeDatabase(workerFunc: any): Promise<void> {
  // Try OPFS first, fall back to in-memory
  const dbOptions = [
    DB_FILENAME,  // Try OPFS first
    ':memory:',   // Fall back to in-memory
  ];

  for (const filename of dbOptions) {
    try {
      const openResponse = await workerFunc('open', { filename });
      if (openResponse.result?.dbId !== undefined) {
        databaseId = openResponse.result.dbId;
        console.log('[SQLiteWorker] Opened database:', filename, 'dbId:', databaseId);
        break;
      }
    } catch (err) {
      console.log('[SQLiteWorker] Failed to open', filename, ':', err);
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
}

// ============================================================================
// QUERY EXECUTION
// ============================================================================

/**
 * Execute a SQLite query
 */
async function executeQuery(method: string, key?: string, value?: string): Promise<unknown> {
  if (!workerPromiser || databaseId === null) {
    throw new Error('SQLite not initialized');
  }

  switch (method) {
    case 'getItem': {
      const result = await workerPromiser('exec', {
        dbId: databaseId,
        sql: 'SELECT value FROM storage WHERE key = ? LIMIT 1',
        bind: [key],
        rowMode: 'object',
        returnValue: 'resultRows',
      });

      if (result?.result && Array.isArray(result.result) && result.result.length > 0) {
        const row = result.result[0] as { value: string };
        return row.value;
      }
      return null;
    }

    case 'setItem': {
      await workerPromiser('exec', {
        dbId: databaseId,
        sql: `
          INSERT INTO storage (key, value, updated_at)
          VALUES (?, ?, strftime('%s', 'now'))
          ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = strftime('%s', 'now')
        `,
        bind: [key, value],
      });
      return undefined;
    }

    case 'removeItem': {
      await workerPromiser('exec', {
        dbId: databaseId,
        sql: 'DELETE FROM storage WHERE key = ?',
        bind: [key],
      });
      return undefined;
    }

    case 'getAllKeys': {
      const result = await workerPromiser('exec', {
        dbId: databaseId,
        sql: 'SELECT key FROM storage ORDER BY key',
        rowMode: 'object',
        returnValue: 'resultRows',
      });

      if (result?.result && Array.isArray(result.result)) {
        return result.result.map((row: any) => row.key);
      }
      return [];
    }

    case 'clear': {
      await workerPromiser('exec', {
        dbId: databaseId,
        sql: 'DELETE FROM storage',
      });
      return undefined;
    }

    case 'init': {
      // Already handled by initSQLite
      return undefined;
    }

    default:
      throw new Error('Unknown method:', method);
  }
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

/**
 * Handle messages from SharedWorker coordinator
 */
self.onmessage = async (e: MessageEvent<CoordinatorMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case 'set-active':
      if (msg.active) {
        console.log('[SQLiteWorker] Becoming active, initializing SQLite...');
        isActive = true;
        try {
          await initSQLite();
          // Notify coordinator we're ready
          coordinatorPort?.postMessage({
            type: 'worker-ready',
          } as WorkerMessage);
        } catch (error) {
          console.error('[SQLiteWorker] Failed to initialize:', error);
        }
      } else {
        console.log('[SQLiteWorker] Becoming inactive');
        isActive = false;
      }
      break;

    case 'sqlite-query':
      if (!isActive) {
        console.warn('[SQLiteWorker] Received query but not active');
        coordinatorPort?.postMessage({
          type: 'sqlite-result',
          error: 'Worker not active',
          replyTo: msg.replyTo,
        } as WorkerMessage);
        return;
      }

      try {
        const result = await executeQuery(msg.method!, msg.key, msg.value);
        coordinatorPort?.postMessage({
          type: 'sqlite-result',
          result,
          replyTo: msg.replyTo,
        } as WorkerMessage);
      } catch (error) {
        console.error('[SQLiteWorker] Query failed:', error);
        coordinatorPort?.postMessage({
          type: 'sqlite-result',
          error: error instanceof Error ? error.message : String(error),
          replyTo: msg.replyTo,
        } as WorkerMessage);
      }
      break;
  }
};

/**
 * Handle connection from SharedWorker
 */
self.onconnect = (event: ExtendableMessageEvent) => {
  coordinatorPort = event.ports[0];
  coordinatorPort.onmessage = (e: MessageEvent<CoordinatorMessage>) => self.onmessage(e.data);
  coordinatorPort.start();
};

// ============================================================================
// EXPORT (for module loading)
// ============================================================================

export {};
