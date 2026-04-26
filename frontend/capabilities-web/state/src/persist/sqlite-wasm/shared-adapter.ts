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

// ============================================================================
// TYPES
// ============================================================================

export interface SharedSQLiteAdapter {
  init(): Promise<void>;
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
  clear(): Promise<void>;
  isReady(): boolean;
}

interface CoordinatorMessage {
  type: 'register' | 'worker-ready' | 'sqlite-query' | 'sqlite-result' | 'set-active' | 'unregister';
  clientId?: string;
  replyTo?: string;
  query?: SQLiteQuery;
  result?: unknown;
  error?: string;
  active?: boolean;
}

interface SQLiteQuery {
  method: 'getItem' | 'setItem' | 'removeItem' | 'getAllKeys' | 'clear' | 'init';
  key?: string;
  value?: string;
}

// ============================================================================
// STATE
// ============================================================================//

let sharedWorker: SharedWorker | null = null;
let workerPort: MessagePort | null = null;
let tabWorker: Worker | null = null;
let clientId: string | null = null;
let isReady = false;
const pendingQueries = new Map<number, {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}>();
let queryId = 0;

// ============================================================================
// SHAREDWORKER SETUP
// ============================================================================

/**
 * Initialize SharedWorker connection
 */
async function initSharedWorker(): Promise<void> {
  if (sharedWorker) {
    return; // Already initialized
  }

  try {
    // Try to load the SharedWorker
    const coordinatorUrl = new URL(
      './workers/sqlite-coordinator.shared.js',
      import.meta.url
    );

    sharedWorker = new SharedWorker(coordinatorUrl, {
      type: 'module',
      name: 'oxlayer-sqlite-coordinator',
    });

    workerPort = sharedWorker.port;
    workerPort.start();

    // Set up message handler
    workerPort.onmessage = handleCoordinatorMessage;

    console.log('[SharedSQLite] SharedWorker connected');
  } catch (error) {
    console.error('[SharedSQLite] Failed to create SharedWorker:', error);
    throw new Error(
      'SharedWorker not supported. Consider using sqliteStorage instead for single-tab usage.'
    );
  }
}

/**
 * Initialize per-tab SQLite worker
 */
async function initTabWorker(): Promise<void> {
  if (tabWorker) {
    return; // Already initialized
  }

  try {
    const workerUrl = new URL('./workers/sqlite-worker.js', import.meta.url);
    tabWorker = new Worker(workerUrl, { type: 'module' });

    // Set up message channel with worker
    const channel = new MessageChannel();
    tabWorker.postMessage({}, [channel.port2]);

    // Worker will notify when ready
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Worker init timeout')), 5000);

      channel.port1.onmessage = (e: MessageEvent) => {
        if (e.data.type === 'ready') {
          clearTimeout(timeout);
          resolve();
        }
      };

      tabWorker!.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
    });

    console.log('[SharedSQLite] Tab worker ready');
  } catch (error) {
    console.error('[SharedSQLite] Failed to create tab worker:', error);
    throw error;
  }
}

/**
 * Handle messages from SharedWorker coordinator
 */
function handleCoordinatorMessage(e: MessageEvent<CoordinatorMessage>): void {
  const msg = e.data;

  switch (msg.type) {
    case 'set-active':
      console.log('[SharedSQLite] Tab is now active:', msg.active);
      break;

    case 'sqlite-result':
      // Resolve pending query
      const query = pendingQueries.get(queryId);
      if (query) {
        pendingQueries.delete(queryId);
        if (msg.error) {
          query.reject(new Error(msg.error));
        } else {
          query.resolve(msg.result);
        }
      }
      break;
  }
}

/**
 * Send query to SharedWorker coordinator
 */
async function sendQuery(method: string, key?: string, value?: string): Promise<unknown> {
  if (!workerPort) {
    throw new Error('SharedWorker not connected. Call init() first.');
  }

  const id = ++queryId;

  return new Promise((resolve, reject) => {
    // Set timeout
    const timeout = setTimeout(() => {
      pendingQueries.delete(id);
      reject(new Error('Query timeout'));
    }, 10000); // 10 second timeout

    pendingQueries.set(id, {
      resolve: (value: unknown) => {
        clearTimeout(timeout);
        resolve(value);
      },
      reject: (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      },
    });

    // Send query to coordinator
    workerPort!.postMessage({
      type: 'sqlite-query',
      query: { method, key, value },
    } as CoordinatorMessage, self.location.origin);
  });
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * SharedWorker SQLite storage singleton
 *
 * Provides the same API as sqliteStorage but with multi-tab coordination.
 */
export const sharedSqliteStorage: SharedSQLiteAdapter = {
  /**
   * Initialize SharedWorker and tab worker
   */
  async init(): Promise<void> {
    if (isReady) {
      return;
    }

    try {
      await initSharedWorker();
      await initTabWorker();

      // Register with coordinator
      clientId = crypto.randomUUID();
      workerPort!.postMessage({
        type: 'register',
        clientId,
      } as CoordinatorMessage, self.location.origin);

      // Initialize SQLite
      await sendQuery('init');

      isReady = true;
      console.log('[SharedSQLite] Ready');
    } catch (error) {
      console.error('[SharedSQLite] Init failed:', error);
      throw error;
    }
  },

  /**
   * Get a value from storage
   */
  async getItem(key: string): Promise<string | null> {
    const result = await sendQuery('getItem', key);
    return result as string | null;
  },

  /**
   * Set a value in storage
   */
  async setItem(key: string, value: string): Promise<void> {
    await sendQuery('setItem', key, value);
  },

  /**
   * Remove a value from storage
   */
  async removeItem(key: string): Promise<void> {
    await sendQuery('removeItem', key);
  },

  /**
   * Get all keys from storage
   */
  async getAllKeys(): Promise<string[]> {
    const result = await sendQuery('getAllKeys');
    return (result as string[]) || [];
  },

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    await sendQuery('clear');
  },

  /**
   * Check if storage is ready
   */
  isReady(): boolean {
    return isReady;
  },
};

// ============================================================================
// FALLBACK
// ============================================================================

/**
 * Check if SharedWorker is supported
 */
export function isSharedWorkerSupported(): boolean {
  try {
    return typeof SharedWorker !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Get the appropriate storage adapter
 *
 * Returns sharedSqliteStorage if SharedWorker is supported (multi-tab),
 * otherwise falls back to regular sqliteStorage (single-tab).
 */
export async function getAutoSqliteStorage(): Promise<SharedSQLiteAdapter> {
  if (isSharedWorkerSupported()) {
    return sharedSqliteStorage;
  }

  // Fall back to regular sqliteStorage for single-tab usage
  const { sqliteStorage } = await import('./index.js');
  return sqliteStorage as unknown as SharedSQLiteAdapter;
}
