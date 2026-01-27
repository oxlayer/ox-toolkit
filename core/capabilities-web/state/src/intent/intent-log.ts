/**
 * @oxlayer/capabilities-web-state/intent
 *
 * Intent Log - The core primitive for intent-first architecture
 *
 * Every user action becomes an append-only fact:
 * 1. Record intent → reflect immediately → deliver eventually
 *
 * UI reacts to intent, not to HTTP.
 * HTTP is just one transport.
 *
 * This is fully domain-agnostic - works for todos, orders, messages, etc.
 */

import { observable, computed } from '@legendapp/state';
import { synced } from '@legendapp/state/sync';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';
import type { UserIntent, DeliveryStatus, IntentActionType } from '../types';
import type { IntentPolicy } from './policy';

/**
 * Intent log entry with workspace metadata
 *
 * Extends UserIntent with workspace tracking.
 */
export interface IntentLogEntry<T = unknown, P = Record<string, unknown>> extends UserIntent<T, P> {
  workspaceId: string;
}

/**
 * Intent log state per workspace
 */
export interface IntentLogState {
  workspaceId: string;
  intents: IntentLogEntry<unknown, Record<string, unknown>>[];
  pendingCount: number;
  failedCount: number;
}

/**
 * Generate a unique intent ID
 */
export function generateIntentId(): string {
  return `intent_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Intent Log Registry
 * Each workspace has its own isolated intent log
 */
const intentLogs = new Map<string, ReturnType<typeof createIntentLog>>();

/**
 * Storage key for intent logs
 */
const INTENT_LOG_PREFIX = 'oxlayer_intent_log_';

/**
 * Get the storage key for a workspace's intent log
 */
export function getIntentLogKey(workspaceId: string): string {
  return `${INTENT_LOG_PREFIX}${workspaceId}`;
}

/**
 * Create an intent log for a workspace
 *
 * The intent log is persisted to localStorage and serves as the
 * source of truth for pending operations.
 *
 * @param workspaceId - The workspace ID
 * @returns The intent log observable
 */
export function createIntentLog(workspaceId: string) {
  const log$ = observable<IntentLogState>(
    synced({
      initial: {
        workspaceId,
        intents: [],
        pendingCount: 0,
        failedCount: 0,
      },
      persist: {
        name: getIntentLogKey(workspaceId),
        plugin: ObservablePersistLocalStorage,
        retrySync: true,
      },
      // No server sync - intent log is local-only
      // Individual intents are synced separately by sync engine
      get: undefined,
      set: undefined,
    })
  );

  return log$;
}

/**
 * Get or create an intent log for a workspace
 *
 * @param workspaceId - The workspace ID
 * @returns The intent log observable
 */
export function getIntentLog(workspaceId: string) {
  if (!intentLogs.has(workspaceId)) {
    intentLogs.set(workspaceId, createIntentLog(workspaceId));
  }
  return intentLogs.get(workspaceId)!;
}

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
export function recordIntent<T, P extends Record<string, unknown> | IntentPolicy = Record<string, unknown>>(
  workspaceId: string,
  intent: Omit<UserIntent<T, P>, 'id' | 'createdAt' | 'status' | 'retries'>
): IntentLogEntry<T, P> {
  console.log('[recordIntent] Called', { workspaceId, intent });
  const log = getIntentLog(workspaceId);
  const current = log.get();

  const entry: IntentLogEntry<T, P> = {
    ...intent,
    id: generateIntentId(),
    workspaceId,
    createdAt: Date.now(),
    status: 'local',
    retries: 0,
  };

  console.log('[recordIntent] Creating entry', { entry, currentIntentsCount: current.intents.length });

  log.set({
    ...current,
    intents: [...current.intents, entry],
    pendingCount: current.pendingCount + 1,
  });

  console.log('[recordIntent] Intent logged', { newPendingCount: current.pendingCount + 1, totalIntents: current.intents.length + 1 });

  return entry;
}

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
export function recordIntentSimple<T = unknown>(
  workspaceId: string,
  domain: string,
  type: IntentActionType,
  entityType: string,
  payload: T,
  entityId?: string,
  policy?: IntentPolicy
): IntentLogEntry<T> {
  return recordIntent<T, IntentPolicy>(workspaceId, {
    domain,
    type,
    entityType,
    entityId: entityId || `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    payload,
    policy,
  });
}

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
export function updateIntentStatus(
  workspaceId: string,
  intentId: string,
  status: DeliveryStatus,
  result?: {
    serverId?: string;
    error?: string;
    confirmedAt?: number;
    retryAt?: number;
    retries?: number;
  }
) {
  const log = getIntentLog(workspaceId);
  const current = log.get();

  const index = current.intents.findIndex((i: IntentLogEntry) => i.id === intentId);
  if (index === -1) return;

  const updated: IntentLogEntry = {
    ...current.intents[index],
    status,
    ...result,
    confirmedAt: result?.confirmedAt || (status === 'confirmed' ? Date.now() : undefined),
    retryAt: result?.retryAt,
    retries: result?.retries ?? current.intents[index].retries,
  };

  // Recalculate counts
  const pendingCount = current.intents.filter(
    (i: IntentLogEntry) => i.id !== intentId
      ? i.status === 'local' || i.status === 'queued' || i.status === 'sending'
      : status === 'local' || status === 'queued' || status === 'sending'
  ).length;
  const failedCount = current.intents.filter(
    (i: IntentLogEntry) => i.id !== intentId
      ? i.status === 'failed'
      : status === 'failed'
  ).length;

  log.set({
    ...current,
    intents: [
      ...current.intents.slice(0, index),
      updated,
      ...current.intents.slice(index + 1),
    ],
    pendingCount,
    failedCount,
  });
}

/**
 * Get pending intents for a workspace
 *
 * These are intents that haven't been confirmed by the server yet.
 * For 'queued' intents with retryAt, only returns those ready to retry.
 *
 * @param workspaceId - The workspace ID
 * @returns Array of pending intents
 */
export function getPendingIntents<T = unknown, P = Record<string, unknown>>(
  workspaceId: string,
  maxRetries?: number
): IntentLogEntry<T, P>[] {
  const log = getIntentLog(workspaceId);
  const current = log.get();
  const now = Date.now();

  return (current.intents || []).filter((intent: IntentLogEntry) => {
    // Always process local intents (first time)
    if (intent.status === 'local') return true;

    // CRITICAL: Don't process 'sending' intents - they're already being processed
    // If they remain in 'sending' state (due to crash/interruption), they need special handling
    // but we should NOT pick them up again immediately to avoid infinite loops
    if (intent.status === 'sending') {
      // Only re-process if it's been stuck for more than 30 seconds (recovery from crash)
      const stuckDuration = now - intent.createdAt;
      return stuckDuration > 30000;
    }

    // For queued intents, check if they're ready to retry AND haven't exceeded max retries
    if (intent.status === 'queued') {
      // Skip if max retries provided and intent has exceeded it
      if (maxRetries !== undefined && intent.retries >= maxRetries) {
        return false;
      }
      // If no retryAt set, process immediately
      if (!intent.retryAt) return true;
      // Only process if retry time has passed
      return now >= intent.retryAt;
    }

    return false;
  }) as IntentLogEntry<T, P>[];
}

/**
 * Get failed intents for a workspace
 *
 * These are intents that failed to sync and may need user attention.
 *
 * @param workspaceId - The workspace ID
 * @returns Array of failed intents
 */
export function getFailedIntents<T = unknown, P = Record<string, unknown>>(
  workspaceId: string
): IntentLogEntry<T, P>[] {
  const log = getIntentLog(workspaceId);
  const current = log.get();

  return current.intents.filter((intent: IntentLogEntry) => intent.status === 'failed') as IntentLogEntry<T, P>[];
}

/**
 * Clear all intents for a workspace
 *
 * Called after successful sync when cleanup is desired.
 *
 * @param workspaceId - The workspace ID
 */
export function clearIntents(workspaceId: string) {
  const log = getIntentLog(workspaceId);
  log.set({
    workspaceId,
    intents: [],
    pendingCount: 0,
    failedCount: 0,
  });
}

/**
 * Delete intent log for a workspace
 *
 * Called when workspace is deleted.
 *
 * @param workspaceId - The workspace ID
 */
export function deleteIntentLog(workspaceId: string): void {
  intentLogs.delete(workspaceId);
  localStorage.removeItem(getIntentLogKey(workspaceId));
}

/**
 * Get intent status for an entity
 *
 * Returns the latest intent status for a specific entity.
 *
 * @param workspaceId - The workspace ID
 * @param entityId - The entity ID
 * @returns The intent status or undefined
 */
export function getEntityIntentStatus(
  workspaceId: string,
  entityId: string
): DeliveryStatus | undefined {
  const log = getIntentLog(workspaceId);
  const current = log.get();

  // Find the most recent intent for this entity
  const entityIntents = current.intents
    .filter((i: IntentLogEntry) => i.entityId === entityId)
    .sort((a: IntentLogEntry, b: IntentLogEntry) => b.createdAt - a.createdAt);

  return entityIntents[0]?.status;
}

/**
 * Get all intents for a specific domain
 *
 * Useful for domain-specific intent queries.
 *
 * @param workspaceId - The workspace ID
 * @param domain - The domain (e.g., 'todo', 'order', 'message')
 * @returns Array of intents for the domain
 */
export function getIntentsByDomain<T = unknown, P = Record<string, unknown>>(
  workspaceId: string,
  domain: string
): IntentLogEntry<T, P>[] {
  const log = getIntentLog(workspaceId);
  const current = log.get();

  return current.intents.filter(
    (intent: IntentLogEntry) => intent.domain === domain
  ) as IntentLogEntry<T, P>[];
}

/**
 * Get all intents for a specific entity
 *
 * @param workspaceId - The workspace ID
 * @param entityId - The entity ID
 * @returns Array of intents for the entity
 */
export function getIntentsByEntity<T = unknown, P = Record<string, unknown>>(
  workspaceId: string,
  entityId: string
): IntentLogEntry<T, P>[] {
  const log = getIntentLog(workspaceId);
  const current = log.get();

  return current.intents.filter(
    (intent: IntentLogEntry) => intent.entityId === entityId
  ) as IntentLogEntry<T, P>[];
}

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
export function getFailedIntentsObservable(workspaceId: string) {
  const log = getIntentLog(workspaceId);
  return computed(() => {
    const current = log.get();
    // Fallback: intents might be undefined before localStorage loads
    return (current.intents || []).filter((intent: IntentLogEntry) => intent.status === 'failed');
  });
}

/**
 * Get failed intents count as a computed observable (reactive)
 *
 * @param workspaceId - The workspace ID
 * @returns Computed observable of failed intents count
 */
export function getFailedIntentsCountObservable(workspaceId: string) {
  const log = getIntentLog(workspaceId);
  return computed(() => log.get().failedCount ?? 0);
}
