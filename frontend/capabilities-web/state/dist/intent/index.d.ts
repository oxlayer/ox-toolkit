import * as _legendapp_state from '@legendapp/state';
import { U as UserIntent, D as DeliveryStatus, I as IntentActionType } from '../types-B56Eq8pd.js';
import { b as IntentPolicy } from '../policy-Dalc5U51.js';
export { I as IntentConflictPolicy, a as IntentDeliveryPolicy, c as IntentPresets, d as IntentRetryPolicy, e as IntentUxPolicy, g as allowsAutoRetry, i as areIntentsInConflict, j as getDefaultPolicy, k as getRetryDelay, n as isOptimistic, o as normalizePolicy, r as requiresImmediateDelivery, p as resolveConflict } from '../policy-Dalc5U51.js';

/**
 * Intent log entry with workspace metadata
 *
 * Extends UserIntent with workspace tracking.
 */
interface IntentLogEntry<T = unknown, P = Record<string, unknown>> extends UserIntent<T, P> {
    workspaceId: string;
}
/**
 * Intent log state per workspace
 */
interface IntentLogState {
    workspaceId: string;
    intents: IntentLogEntry<unknown, Record<string, unknown>>[];
    pendingCount: number;
    failedCount: number;
}
/**
 * Generate a unique intent ID
 */
declare function generateIntentId(): string;
/**
 * Get the storage key for a workspace's intent log
 */
declare function getIntentLogKey(workspaceId: string): string;
/**
 * Create an intent log for a workspace
 *
 * The intent log is persisted to localStorage and serves as the
 * source of truth for pending operations.
 *
 * @param workspaceId - The workspace ID
 * @returns The intent log observable
 */
declare function createIntentLog(workspaceId: string): _legendapp_state.Observable<IntentLogState>;
/**
 * Get or create an intent log for a workspace
 *
 * @param workspaceId - The workspace ID
 * @returns The intent log observable
 */
declare function getIntentLog(workspaceId: string): _legendapp_state.Observable<IntentLogState>;
/**
 * Record a new intent (core primitive)
 *
 * This is THE operation - all user actions should call this.
 * The intent is recorded immediately (local-first), then synced eventually.
 *
 * @param workspaceId - The workspace ID
 * @param intent - The intent to record
 * @returns The recorded intent entry
 *
 * @example
 * ```ts
 * // Todo app
 * recordIntent('ws_123', {
 *   domain: 'todo',
 *   type: 'create',
 *   entityType: 'task',
 *   entityId: 'temp_123',
 *   payload: { title: 'Buy milk', completed: false },
 *   policy: IntentPresets.optimistic,
 * })
 *
 * // Ecommerce app
 * recordIntent('ws_456', {
 *   domain: 'order',
 *   type: 'update',
 *   entityType: 'cart',
 *   entityId: 'cart_789',
 *   payload: { action: 'add_item', itemId: 'prod_123', quantity: 2 },
 *   policy: IntentPresets.optimistic,
 * })
 *
 * // Payment (critical)
 * recordIntent('ws_789', {
 *   domain: 'payment',
 *   type: 'custom',
 *   entityType: 'transaction',
 *   entityId: 'txn_456',
 *   payload: { amount: 99.99, method: 'card' },
 *   policy: IntentPresets.critical,
 * })
 * ```
 */
declare function recordIntent<T, P extends Record<string, unknown> | IntentPolicy = Record<string, unknown>>(workspaceId: string, intent: Omit<UserIntent<T, P>, 'id' | 'createdAt' | 'status' | 'retries'>): IntentLogEntry<T, P>;
/**
 * Record intent with convenience parameters (simpler API)
 *
 * @param workspaceId - The workspace ID
 * @param domain - The domain (e.g., 'todo', 'order', 'message')
 * @param type - The action type
 * @param entityType - The entity type
 * @param payload - The payload
 * @param entityId - The entity ID (optional, auto-generated for create)
 * @param policy - The policy (optional, uses default)
 * @returns The recorded intent entry
 */
declare function recordIntentSimple<T = unknown>(workspaceId: string, domain: string, type: IntentActionType, entityType: string, payload: T, entityId?: string, policy?: IntentPolicy): IntentLogEntry<T>;
/**
 * Update intent status
 *
 * Called by the sync engine when intent state changes.
 *
 * @param workspaceId - The workspace ID
 * @param intentId - The intent ID
 * @param status - The new status
 * @param result - Optional result data (serverId, error, retryAt, etc.)
 */
declare function updateIntentStatus(workspaceId: string, intentId: string, status: DeliveryStatus, result?: {
    serverId?: string;
    error?: string;
    confirmedAt?: number;
    retryAt?: number;
    retries?: number;
}): void;
/**
 * Get pending intents for a workspace
 *
 * These are intents that haven't been confirmed by the server yet.
 * For 'queued' intents with retryAt, only returns those ready to retry.
 *
 * @param workspaceId - The workspace ID
 * @returns Array of pending intents
 */
declare function getPendingIntents<T = unknown, P = Record<string, unknown>>(workspaceId: string, maxRetries?: number): IntentLogEntry<T, P>[];
/**
 * Get failed intents for a workspace
 *
 * These are intents that failed to sync and may need user attention.
 *
 * @param workspaceId - The workspace ID
 * @returns Array of failed intents
 */
declare function getFailedIntents<T = unknown, P = Record<string, unknown>>(workspaceId: string): IntentLogEntry<T, P>[];
/**
 * Clear all intents for a workspace
 *
 * Called after successful sync when cleanup is desired.
 *
 * @param workspaceId - The workspace ID
 */
declare function clearIntents(workspaceId: string): void;
/**
 * Delete intent log for a workspace
 *
 * Called when workspace is deleted.
 *
 * @param workspaceId - The workspace ID
 */
declare function deleteIntentLog(workspaceId: string): void;
/**
 * Get intent status for an entity
 *
 * Returns the latest intent status for a specific entity.
 *
 * @param workspaceId - The workspace ID
 * @param entityId - The entity ID
 * @returns The intent status or undefined
 */
declare function getEntityIntentStatus(workspaceId: string, entityId: string): DeliveryStatus | undefined;
/**
 * Get all intents for a specific domain
 *
 * Useful for domain-specific intent queries.
 *
 * @param workspaceId - The workspace ID
 * @param domain - The domain (e.g., 'todo', 'order', 'message')
 * @returns Array of intents for the domain
 */
declare function getIntentsByDomain<T = unknown, P = Record<string, unknown>>(workspaceId: string, domain: string): IntentLogEntry<T, P>[];
/**
 * Get all intents for a specific entity
 *
 * @param workspaceId - The workspace ID
 * @param entityId - The entity ID
 * @returns Array of intents for the entity
 */
declare function getIntentsByEntity<T = unknown, P = Record<string, unknown>>(workspaceId: string, entityId: string): IntentLogEntry<T, P>[];
/**
 * Get failed intents as a computed observable (reactive)
 *
 * This returns a LegendState computed observable that automatically updates
 * when the intent log changes. Use with useValue() in React for reactive rendering.
 *
 * @param workspaceId - The workspace ID
 * @returns Computed observable of failed intents
 *
 * @example
 * ```tsx
 * import { useValue } from '@legendapp/state/react';
 * import { getFailedIntentsObservable } from '@oxlayer/capabilities-web-state';
 *
 * function FailedIntentsList() {
 *   const failedIntents$ = getFailedIntentsObservable(workspaceId);
 *   const failedIntents = useValue(failedIntents$);
 *   return <div>{failedIntents.length} failed</div>;
 * }
 * ```
 */
declare function getFailedIntentsObservable(workspaceId: string): _legendapp_state.Observable<IntentLogEntry<unknown, Record<string, unknown>>[]>;
/**
 * Get failed intents count as a computed observable (reactive)
 *
 * @param workspaceId - The workspace ID
 * @returns Computed observable of failed intents count
 */
declare function getFailedIntentsCountObservable(workspaceId: string): _legendapp_state.ObservablePrimitive<number>;

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
/**
 * Sync engine configuration
 */
interface SyncEngineConfig {
    maxRetries: number;
    retryDelay: number;
    syncInterval: number;
    enableSync: boolean;
}
/**
 * Sync engine state
 */
interface SyncEngineState {
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
interface ApiAdapter<TPayload = unknown, TResult = unknown> {
    /** Create a new entity */
    create?: (payload: TPayload) => Promise<{
        id: string;
        data: TResult;
    }>;
    /** Update an existing entity */
    update?: (id: string, payload: TPayload) => Promise<{
        data: TResult;
    }>;
    /** Delete an entity */
    delete?: (id: string) => Promise<void>;
    /** Custom action (for 'custom' type intents) */
    custom?: (action: string, payload: TPayload) => Promise<{
        id?: string;
        data?: TResult;
    }>;
}
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
declare function registerApiAdapter<TPayload, TResult>(domain: string, entityType: string, adapter: ApiAdapter<TPayload, TResult>): void;
/**
 * Unregister an API adapter
 *
 * @param domain - The domain
 * @param entityType - The entity type
 */
declare function unregisterApiAdapter(domain: string, entityType: string): void;
/**
 * Sync engine instance
 */
declare class SyncEngine {
    config: SyncEngineConfig;
    private state;
    private intervalId;
    private workspaceId;
    constructor(workspaceId: string, config?: Partial<SyncEngineConfig>);
    /**
     * Start the sync engine
     */
    start(): void;
    /**
     * Stop the sync engine
     */
    stop(): void;
    /**
     * Process all pending intents
     *
   * Policy-aware:
   * - Skips intents that require immediate delivery when offline
   * - Respects intent retry policies
   * - Processes by priority (higher first)
     */
    private processPendingIntents;
    /**
     * Process a single intent
     *
   * Policy-aware execution based on intent's policy.
     */
    private processIntent;
    /**
     * Handle online event
     */
    private handleOnline;
    /**
     * Handle offline event
     */
    private handleOffline;
    /**
     * Get the sync engine state
     */
    getState(): _legendapp_state.Observable<SyncEngineState>;
    /**
     * Manually trigger a sync
     */
    syncNow(): Promise<void>;
}
/**
 * Get or create a sync engine for a workspace
 *
 * @param workspaceId - The workspace ID
 * @param config - Optional configuration
 * @returns The sync engine instance
 */
declare function getSyncEngine(workspaceId: string, config?: Partial<SyncEngineConfig>): SyncEngine;
/**
 * Stop a sync engine
 *
 * @param workspaceId - The workspace ID
 */
declare function stopSyncEngine(workspaceId: string): void;
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
declare function registerApiAdapters(adapters: Record<string, ApiAdapter>): void;

export { type ApiAdapter, type IntentLogEntry, type IntentLogState, IntentPolicy, SyncEngine, type SyncEngineConfig, type SyncEngineState, clearIntents, createIntentLog, deleteIntentLog, generateIntentId, getEntityIntentStatus, getFailedIntents, getFailedIntentsCountObservable, getFailedIntentsObservable, getIntentLog, getIntentLogKey, getIntentsByDomain, getIntentsByEntity, getPendingIntents, getSyncEngine, recordIntent, recordIntentSimple, registerApiAdapter, registerApiAdapters, stopSyncEngine, unregisterApiAdapter, updateIntentStatus };
