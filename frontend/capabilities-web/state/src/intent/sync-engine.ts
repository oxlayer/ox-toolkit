/**
 * @oxlayer/capabilities-web-state/intent
 *
 * Sync Engine - Processes intents and reconciles with server
 *
 * Data flow:
 * [ UI Action ]
 *      ↓
 * [ Intent Recorded ]  ← Legend State (instant)
 *      ↓
 * [ Optimistic View ]  ← UI updates immediately
 *      ↓
 * [ Sync Engine ]
 *   ├─ offline → queue
 *   └─ online  → send
 *      ↓
 * [ API Ack ]
 *      ↓
 * [ Status Update ]
 *      ↓
 * [ React Query Revalidate ]
 *
 * Policy-aware: Reads intent policy to decide behavior.
 */

import { observable, batch } from '@legendapp/state';
import type { DeliveryStatus } from '../types';
import type { IntentLogEntry } from './intent-log';
import type { IntentPolicy } from './policy';
import {
  updateIntentStatus,
  getPendingIntents,
} from './intent-log';

/**
 * Sync engine configuration
 */
export interface SyncEngineConfig {
  maxRetries: number;
  retryDelay: number;           // ms base delay
  syncInterval: number;         // ms - how often to check for pending intents
  enableSync: boolean;          // master switch for syncing
}

/**
 * Default sync engine configuration
 * - maxRetries: 5 attempts before marking as failed
 * - retryDelay: 1s base, exponential backoff capped at 60s
 * - syncInterval: 2s between sync checks
 */
const DEFAULT_CONFIG: SyncEngineConfig = {
  maxRetries: 5,
  retryDelay: 1000,
  syncInterval: 2000,
  enableSync: true,
};

/**
 * Sync engine state
 */
export interface SyncEngineState {
  isRunning: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: number | null;
  syncCount: number;
  errorCount: number;
  lastError: string | null;
}

/**
 * API adapter for a domain
 *
 * Each domain (todo, order, message, etc.) registers its adapter.
 * The adapter knows how to call the server for that domain.
 *
 * Generic across all domains - not tied to specific entity types.
 */
export interface ApiAdapter<TPayload = unknown, TResult = unknown> {
  /** Create a new entity */
  create?: (payload: TPayload) => Promise<{ id: string; data: TResult }>;
  /** Update an existing entity */
  update?: (id: string, payload: TPayload) => Promise<{ data: TResult }>;
  /** Delete an entity */
  delete?: (id: string) => Promise<void>;
  /** Custom action (for 'custom' type intents) */
  custom?: (action: string, payload: TPayload) => Promise<{ id?: string; data?: TResult }>;
}

/**
 * API adapter registry keyed by domain
 *
 * Structure: Map<domain, Map<entityType, adapter>>
 *
 * This allows multiple entity types per domain:
 * - 'todo' domain → 'task', 'label', 'project' adapters
 * - 'order' domain → 'cart', 'item', 'payment' adapters
 * - 'chat' domain → 'message', 'conversation' adapters
 */
const apiAdapters = new Map<string, Map<string, ApiAdapter>>();

/**
 * Register an API adapter for a domain/entity type combination
 *
 * @param domain - The domain (e.g., 'todo', 'order', 'message')
 * @param entityType - The entity type (e.g., 'task', 'cart', 'message')
 * @param adapter - The API adapter
 *
 * @example
 * ```ts
 * // Todo app
 * registerApiAdapter('todo', 'task', {
 *   create: async (payload) => {
 *     const response = await fetch('/api/todos', {
 *       method: 'POST',
 *       body: JSON.stringify(payload),
 *     });
 *     return response.json();
 *   },
 *   update: async (id, payload) => { ... },
 *   delete: async (id) => { ... },
 * });
 *
 * // Ecommerce app
 * registerApiAdapter('order', 'cart', {
 *   create: async (payload) => { ... },
 *   update: async (id, payload) => { ... },
 * });
 *
 * // Chat app
 * registerApiAdapter('chat', 'message', {
 *   create: async (payload) => { ... },
 *   custom: async (action, payload) => {
 *     if (action === 'mark_read') { ... }
 *   },
 * });
 * ```
 */
export function registerApiAdapter<TPayload, TResult>(
  domain: string,
  entityType: string,
  adapter: ApiAdapter<TPayload, TResult>
) {
  if (!apiAdapters.has(domain)) {
    apiAdapters.set(domain, new Map());
  }
  apiAdapters.get(domain)!.set(entityType, adapter as ApiAdapter<unknown>);
}

/**
 * Unregister an API adapter
 *
 * @param domain - The domain
 * @param entityType - The entity type
 */
export function unregisterApiAdapter(domain: string, entityType: string) {
  const domainAdapters = apiAdapters.get(domain);
  if (domainAdapters) {
    domainAdapters.delete(entityType);
    if (domainAdapters.size === 0) {
      apiAdapters.delete(domain);
    }
  }
}

/**
 * Get an API adapter for a domain/entity type
 *
 * @param domain - The domain
 * @param entityType - The entity type
 * @returns The adapter or undefined
 */
function getApiAdapter(domain: string, entityType: string): ApiAdapter | undefined {
  const domainAdapters = apiAdapters.get(domain);
  return domainAdapters?.get(entityType);
}

/**
 * Sync engine instance
 */
export class SyncEngine {
  public config: SyncEngineConfig;
  private state = observable<SyncEngineState>({
    isRunning: false,
    isOnline: true,
    isSyncing: false,
    lastSyncAt: null,
    syncCount: 0,
    errorCount: 0,
    lastError: null,
  });
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private workspaceId: string;

  constructor(workspaceId: string, config: Partial<SyncEngineConfig> = {}) {
    this.workspaceId = workspaceId;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start the sync engine
   */
  start() {
    if (this.state.isRunning.get()) return;

    this.state.isRunning.set(true);
    this.state.isOnline.set(navigator.onLine);

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Start sync interval
    this.intervalId = setInterval(() => {
      if (this.state.isOnline.get() && this.config.enableSync) {
        this.processPendingIntents();
      }
    }, this.config.syncInterval);

    // Initial sync (only if sync is enabled)
    if (this.config.enableSync) {
      this.processPendingIntents();
    }
  }

  /**
   * Stop the sync engine
   */
  stop() {
    if (!this.state.isRunning.get()) return;

    this.state.isRunning.set(false);

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Process all pending intents
   *
 * Policy-aware:
 * - Skips intents that require immediate delivery when offline
 * - Respects intent retry policies
 * - Processes by priority (higher first)
   */
  private async processPendingIntents() {
    // Don't process if sync is disabled
    if (!this.config.enableSync) return;

    if (this.state.isSyncing.get()) return;

    const pending = getPendingIntents(this.workspaceId, this.config.maxRetries);
    if (pending.length === 0) return;

    this.state.isSyncing.set(true);

    // Sort by priority (higher first) if policy specifies it
    const sorted = [...pending].sort((a, b) => {
      const aPriority = (a.policy as any)?.priority || 0;
      const bPriority = (b.policy as any)?.priority || 0;
      return bPriority - aPriority;
    });

    for (const intent of sorted) {
      await this.processIntent(intent);
    }

    this.state.isSyncing.set(false);
    this.state.lastSyncAt.set(Date.now());
    this.state.syncCount.set(this.state.syncCount.get() + 1);
  }

  /**
   * Process a single intent
   *
 * Policy-aware execution based on intent's policy.
   */
  private async processIntent(intent: IntentLogEntry) {
    const policy = intent.policy as IntentPolicy | undefined;
    const adapter = getApiAdapter(intent.domain, intent.entityType);

    // GUARD: Check if max retries exceeded before processing
    if (intent.retries >= this.config.maxRetries && intent.status !== 'confirmed' && intent.status !== 'acknowledged') {
      console.error(`[SyncEngine] Max retries (${this.config.maxRetries}) exceeded for intent ${intent.id}, marking as failed`);
      batch(() => {
        updateIntentStatus(
          this.workspaceId,
          intent.id,
          'failed',
          { error: intent.error || 'Max retries exceeded' }
        );
        this.state.errorCount.set(this.state.errorCount.get() + 1);
      });
      return;
    }

    if (!adapter) {
      console.warn(`[SyncEngine] No adapter found for domain: ${intent.domain}, entityType: ${intent.entityType}`);
      return;
    }

    // RUNTIME GUARD: writeMode invariant
    // HARD STOP for local-only intents - they never reach the sync engine
    if (policy?.writeMode === 'local-only') {
      console.error(`[SyncEngine] CRITICAL: local-only intent should never reach sync engine: ${intent.id}`);
      // This is a programming error - local-only intents should be applied locally and never enqueued
      updateIntentStatus(this.workspaceId, intent.id, 'failed', {
        error: 'Local-only intent cannot be synced - this is a bug',
      });
      return;
    }

    // API-first intents must NOT be applied to local state
    if (policy?.writeMode === 'api-first') {
      // Skip local state application entirely
      // This intent ONLY goes to the API
      console.log(`[SyncEngine] API-first intent, skipping local state: ${intent.id}`);
    }

    // Check policy: immediate delivery requires online
    if (policy?.delivery === 'immediate' && !this.state.isOnline.get()) {
      // Keep as queued, don't retry automatically
      updateIntentStatus(this.workspaceId, intent.id, 'queued', {
        error: 'Offline - immediate delivery required',
      });
      return;
    }

    // Check policy: no retry
    if (policy?.retry === 'none' && intent.retries > 0) {
      updateIntentStatus(this.workspaceId, intent.id, 'failed', {
        error: 'Retry policy: none',
      });
      return;
    }

    // Log retry attempt
    console.log(`[SyncEngine] Processing intent ${intent.id} (attempt ${intent.retries + 1}, type: ${intent.type}, entity: ${intent.entityType})`);

    // Update status to sending
    updateIntentStatus(this.workspaceId, intent.id, 'sending');

    try {
      let result: { id?: string; data?: unknown } | undefined;

      switch (intent.type) {
        case 'create':
          if (adapter.create) {
            result = await adapter.create(intent.payload);
          }
          break;
        case 'update':
          if (adapter.update) {
            result = await adapter.update(intent.entityId, intent.payload);
          }
          break;
        case 'delete':
          if (adapter.delete) {
            await adapter.delete(intent.entityId);
            result = {};
          }
          break;
        case 'custom':
          if (adapter.custom) {
            result = await adapter.custom(intent.entityType, intent.payload);
          }
          break;
      }

      // Success - update to acknowledged
      updateIntentStatus(
        this.workspaceId,
        intent.id,
        'acknowledged',
        {
          serverId: result?.id,
        }
      );

      // After a short delay, mark as confirmed
      setTimeout(() => {
        updateIntentStatus(
          this.workspaceId,
          intent.id,
          'confirmed',
          {
            confirmedAt: Date.now(),
          }
        );
      }, 500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Check policy for retry behavior
      const shouldRetry = policy?.retry === 'auto' || (!policy || policy.retry === undefined);

      if (shouldRetry && intent.retries < this.config.maxRetries) {
        // Calculate retry delay based on policy or exponential backoff (capped at 60s)
        const delay = Math.min(
          policy
            ? (intent.retries + 1) * this.config.retryDelay
            : this.config.retryDelay * Math.pow(2, intent.retries),
          60000 // Max 60 seconds
        );
        const retryAt = Date.now() + delay;

        console.log(`[SyncEngine] Scheduling retry ${intent.retries + 1}/${this.config.maxRetries} for intent ${intent.id} in ${delay}ms (at ${new Date(retryAt).toISOString()})`);

        // Schedule retry with timestamp - increment retries atomically
        updateIntentStatus(
          this.workspaceId,
          intent.id,
          'queued',
          { error: errorMessage, retryAt, retries: intent.retries + 1 }
        );

        // Note: No setTimeout needed - the sync interval will pick up the intent
        // when retryAt timestamp is reached (via getPendingIntents filtering)

      } else {
        // Max retries reached or policy says no retry - mark as failed
        console.error(`[SyncEngine] Max retries (${this.config.maxRetries}) reached for intent ${intent.id}, marking as failed. Error: ${errorMessage}`);
        batch(() => {
          updateIntentStatus(
            this.workspaceId,
            intent.id,
            'failed',
            { error: errorMessage }
          );
          this.state.errorCount.set(this.state.errorCount.get() + 1);
          this.state.lastError.set(errorMessage);
        });
      }
    }
  }

  /**
   * Handle online event
   */
  private handleOnline = () => {
    this.state.isOnline.set(true);
    // Trigger immediate sync (only if sync is enabled)
    if (this.config.enableSync) {
      this.processPendingIntents();
    }
  };

  /**
   * Handle offline event
   */
  private handleOffline = () => {
    this.state.isOnline.set(false);
  };

  /**
   * Get the sync engine state
   */
  getState() {
    return this.state;
  }

  /**
   * Manually trigger a sync
   */
  async syncNow() {
    // Only sync if enabled
    if (!this.config.enableSync) return;
    await this.processPendingIntents();
  }
}

/**
 * Sync engine registry
 */
const syncEngines = new Map<string, SyncEngine>();

/**
 * Get or create a sync engine for a workspace
 *
 * @param workspaceId - The workspace ID
 * @param config - Optional configuration
 * @returns The sync engine instance
 */
export function getSyncEngine(workspaceId: string, config?: Partial<SyncEngineConfig>): SyncEngine {
  console.log('[getSyncEngine] Called', { workspaceId, config, existingEngine: syncEngines.has(workspaceId) });

  if (!syncEngines.has(workspaceId)) {
    const engine = new SyncEngine(workspaceId, config);
    syncEngines.set(workspaceId, engine);
    console.log('[getSyncEngine] Created new engine', { workspaceId, enableSync: engine.config.enableSync });
    // Only start if sync is enabled
    if (engine.config.enableSync) {
      console.log('[getSyncEngine] Starting engine because enableSync=true');
      engine.start();
    } else {
      console.log('[getSyncEngine] NOT starting engine because enableSync=false');
    }
  } else if (config) {
    // Update existing engine's config if provided
    const engine = syncEngines.get(workspaceId)!;
    const wasEnabled = engine.config.enableSync;
    Object.assign(engine.config, config);
    console.log('[getSyncEngine] Updated existing engine config', { workspaceId, wasEnabled, nowEnabled: engine.config.enableSync });

    // Start/stop based on enableSync changes
    if (!wasEnabled && engine.config.enableSync) {
      console.log('[getSyncEngine] Starting engine (was disabled, now enabled)');
      engine.start();
    } else if (wasEnabled && !engine.config.enableSync) {
      console.log('[getSyncEngine] Stopping engine (was enabled, now disabled)');
      engine.stop();
    }
  }
  return syncEngines.get(workspaceId)!;
}

/**
 * Stop a sync engine
 *
 * @param workspaceId - The workspace ID
 */
export function stopSyncEngine(workspaceId: string) {
  const engine = syncEngines.get(workspaceId);
  if (engine) {
    engine.stop();
    syncEngines.delete(workspaceId);
  }
}

/**
 * Register API adapters in bulk
 *
 * @param adapters - Map of domain.entityType to adapter
 *
 * @example
 * ```ts
 * registerApiAdapters({
 *   'todo.task': todoTaskAdapter,
 *   'todo.project': todoProjectAdapter,
 *   'order.cart': orderCartAdapter,
 *   'chat.message': chatMessageAdapter,
 * });
 * ```
 */
export function registerApiAdapters(adapters: Record<string, ApiAdapter>) {
  for (const [key, adapter] of Object.entries(adapters)) {
    const [domain, entityType] = key.split('.');
    registerApiAdapter(domain, entityType, adapter);
  }
}
