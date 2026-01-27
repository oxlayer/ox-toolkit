/**
 * React hooks for reactively observing failed intents
 *
 * These hooks use LegendState's reactivity to automatically update
 * when failed intents change, without polling.
 */

import { observable } from '@legendapp/state';
import { useSelector } from '@legendapp/state/react';
import { getFailedIntentsObservable, getFailedIntentsCountObservable } from '@oxlayer/capabilities-web-state';
import type { IntentLogEntry } from '@oxlayer/capabilities-web-state';

// Module-level constants for empty state (stable references, avoid recreating on every render)
const EMPTY_FAILED_INTENTS$ = observable<IntentLogEntry[]>([]);
const ZERO_FAILED_COUNT$ = observable(0);

/**
 * Reactively observe failed intents for a workspace
 *
 * Automatically re-renders when failed intents change.
 * This replaces the polling-based approach with proper reactive updates.
 *
 * @param workspaceId - The workspace ID
 * @returns Array of failed intents (reactive)
 *
 * @example
 * ```tsx
 * function FailedIntentsList() {
 *   const { currentWorkspace } = useWorkspace();
 *   const failedIntents = useFailedIntents(currentWorkspace?.id || '');
 *
 *   return (
 *     <div>
 *       {failedIntents.map(intent => (
 *         <FailedIntentItem key={intent.id} intent={intent} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFailedIntents(workspaceId: string): IntentLogEntry[] {
  const obs$ = workspaceId
    ? getFailedIntentsObservable(workspaceId)
    : EMPTY_FAILED_INTENTS$;

  return useSelector(obs$);
}

/**
 * Reactively observe failed intents count for a workspace
 *
 * Automatically re-renders when the count changes.
 * Useful for badge counts and indicators.
 *
 * @param workspaceId - The workspace ID
 * @returns Number of failed intents (reactive)
 *
 * @example
 * ```tsx
 * function NotificationBadge() {
 *   const { currentWorkspace } = useWorkspace();
 *   const failedCount = useFailedIntentsCount(currentWorkspace?.id || '');
 *
 *   return (
 *     <BellIcon />
 *     {failedCount > 0 && (
 *       <span className="badge">{failedCount}</span>
 *     )}
 *   );
 * }
 * ```
 */
export function useFailedIntentsCount(workspaceId: string): number {
  const obs$ = workspaceId
    ? getFailedIntentsCountObservable(workspaceId)
    : ZERO_FAILED_COUNT$;

  return useSelector(obs$);
}
