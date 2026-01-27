/**
 * @oxlayer/capabilities-state/persist/sqlite-wasm/workers
 *
 * SharedWorker SQLite Coordinator (Notion-style, production-grade)
 *
 * Guarantees single-writer SQLite access across tabs while allowing all tabs
 * to read/write through one logical database.
 *
 * Architecture:
 * ┌───────────────┐     ┌────────────────────┐
 * │  Tab A        │     │                    │
 * │  Web Worker A │────▶│                    │
 * ├───────────────┤     │   SharedWorker     │──▶ Active Tab Worker
 * │  Tab B        │     │   (Coordinator)    │     (SQLite owner)
 * │  Web Worker B │────▶│                    │
 * ├───────────────┤     │                    │
 * │  Tab C        │     │                    │
 * │  Web Worker C │────▶│                    │
 * └───────────────┘     └────────────────────┘
 *
 * Invariants:
 * - Only ONE Web Worker ever touches SQLite
 * - All tabs can issue queries concurrently
 * - SharedWorker routes queries to active tab
 * - Active tab can change at runtime
 *
 * @example
 * This file should be loaded as a SharedWorker:
 * ```ts
 * const coordinator = new SharedWorker(
 *   new URL('./sqlite-coordinator.shared.ts', import.meta.url),
 *   { type: 'module' }
 * );
 * ```
 */

// ============================================================================
// TYPES
// ============================================================================

type ClientId = string;

interface Client {
  port: MessagePort;
  workerReady: boolean;
}

interface CoordinatorMessage {
  type: 'register' | 'worker-ready' | 'sqlite-query' | 'sqlite-result' | 'unregister';
  clientId?: ClientId;
  replyTo?: ClientId;
  query?: SQLiteQuery;
  result?: unknown;
  error?: string;
}

interface SQLiteQuery {
  method: 'getItem' | 'setItem' | 'removeItem' | 'getAllKeys' | 'clear' | 'init';
  key?: string;
  value?: string;
}

// ============================================================================
// STATE
// ============================================================================

const clients = new Map<ClientId, Client>();
let activeClientId: ClientId | null = null;

// ============================================================================
// CONNECTION HANDLING
// ============================================================================

/**
 * Handle new tab connection to SharedWorker
 */
self.onconnect = (event: ExtendableMessageEvent) => {
  const port = event.ports[0];
  const clientId = crypto.randomUUID();

  console.log('[SQLiteCoordinator] Client connected:', clientId);

  // Register new client
  clients.set(clientId, { port, workerReady: false });

  // Set up message handler
  port.onmessage = (e: MessageEvent<CoordinatorMessage>) => handleMessage(clientId, e.data);
  port.onmessageerror = () => cleanup(clientId);
  port.onclose = () => cleanup(clientId);
  port.start();

  // If this is the first client, make it active
  if (!activeClientId) {
    setActiveClient(clientId);
  }
};

/**
 * Handle incoming messages from clients
 */
function handleMessage(fromId: ClientId, msg: CoordinatorMessage): void {
  const client = clients.get(fromId);

  if (!client) {
    console.warn('[SQLiteCoordinator] Unknown client:', fromId);
    return;
  }

  switch (msg.type) {
    case 'worker-ready':
      // Worker in this tab is ready to handle SQLite
      client.workerReady = true;
      console.log('[SQLiteCoordinator] Worker ready:', fromId);
      break;

    case 'sqlite-query':
      // Route query to active SQLite worker
      if (!activeClientId) {
        // No active worker yet, promote this client
        setActiveClient(fromId);
      }

      if (activeClientId === fromId && client.workerReady) {
        // This client IS the active worker, execute directly
        // (handled by the worker itself)
        return;
      }

      // Forward to active worker
      const activeClient = clients.get(activeClientId!);
      if (activeClient?.workerReady) {
        activeClient.port.postMessage({
          ...msg,
          replyTo: fromId,
        } as CoordinatorMessage);
      } else {
        // Active worker not ready, send error back
        client.port.postMessage({
          type: 'sqlite-result',
          error: 'SQLite worker not ready',
          replyTo: fromId,
        } as CoordinatorMessage);
      }
      break;

    case 'sqlite-result':
      // Route result back to original requester
      const target = msg.replyTo ? clients.get(msg.replyTo) : null;
      if (target) {
        target.port.postMessage(msg);
      }
      break;

    case 'unregister':
      cleanup(fromId);
      break;
  }
}

/**
 * Set a client as the active SQLite worker
 */
function setActiveClient(clientId: ClientId): void {
  // Deactivate previous active client
  if (activeClientId && activeClientId !== clientId) {
    const previousClient = clients.get(activeClientId);
    if (previousClient?.port) {
      previousClient.port.postMessage({
        type: 'set-active',
        active: false,
      } as CoordinatorMessage);
    }
  }

  activeClientId = clientId;
  console.log('[SQLiteCoordinator] Active client set:', clientId);

  // Notify new active client
  const newClient = clients.get(clientId);
  if (newClient?.port) {
    newClient.port.postMessage({
      type: 'set-active',
      active: true,
    } as CoordinatorMessage);
  }
}

/**
 * Clean up disconnected client
 * If this was the active client, promote a new one
 */
function cleanup(clientId: ClientId): void {
  console.log('[SQLiteCoordinator] Cleaning up client:', clientId);
  clients.delete(clientId);

  // If this was the active client, promote a new one
  if (activeClientId === clientId) {
    console.log('[SQLiteCoordinator] Active client disconnected, promoting new client');
    promoteNewActiveClient();
  }
}

/**
 * Promote a new client to be the active SQLite worker
 */
function promoteNewActiveClient(): void {
  // Find first client with ready worker
  for (const [id, client] of clients) {
    if (client.workerReady) {
      setActiveClient(id);
      return;
    }
  }

  // No ready workers found
  activeClientId = null;
  console.log('[SQLiteCoordinator] No active client available');
}

// ============================================================================
// EXPORT FOR TYPESCRIPT (not used at runtime, but helps with imports)
// ============================================================================

export type { CoordinatorMessage, SQLiteQuery };
