/**
 * Intent Sync Initialization Hook
 *
 * Initializes the intent-first sync system:
 * 1. Registers API adapters with sync engine
 * 2. Gets/updates sync engine for current workspace
 * 3. Handles cleanup on unmount
 *
 * Call this in your app root or workspace provider.
 *
 * @example
 * ```tsx
 * function App() {
 *   useIntentSyncInit();
 *   return <YourApp />;
 * }
 * ```
 */

import { useEffect, useRef } from 'react';
import { useWorkspace } from '@/lib/workspace';
import { useAuth } from '@/lib/auth';
import {
  getSyncEngine,
} from '@oxlayer/capabilities-web-state';
import { registerTodoApiAdapters, unregisterTodoApiAdapters } from '@/lib/sync/api-adapters';

/**
 * Initialize intent sync system
 *
 * This hook:
 * - Registers API adapters once on mount
 * - Gets/updates sync engine for current workspace
 * - Sync engine automatically starts/stops based on enableSync config
 */
export function useIntentSyncInit() {
  const { currentWorkspace } = useWorkspace();
  const { isAuthenticated } = useAuth();
  const adaptersRegistered = useRef(false);
  const previousWorkspaceId = useRef<string | null>(null);

  useEffect(() => {
    // Register API adapters once
    if (!adaptersRegistered.current) {
      registerTodoApiAdapters();
      adaptersRegistered.current = true;
    }

    // Cleanup: unregister adapters on unmount
    return () => {
      if (adaptersRegistered.current) {
        unregisterTodoApiAdapters();
        adaptersRegistered.current = false;
      }
    };
  }, []);

  useEffect(() => {
    if (!currentWorkspace?.id) return;

    // Get or update sync engine for current workspace
    // The engine is created/updated with enableSync based on auth state
    getSyncEngine(currentWorkspace.id, {
      maxRetries: 5, // 5 retries before marking as failed
      retryDelay: 1000,
      syncInterval: 2000,
      enableSync: isAuthenticated, // Only sync when authenticated
    });

    previousWorkspaceId.current = currentWorkspace.id;
  }, [currentWorkspace?.id, isAuthenticated]);
}

/**
 * Hook to get sync engine state
 *
 * Returns observable state of the sync engine for current workspace.
 *
 * @example
 * ```tsx
 * const syncState = useSyncEngineState();
 *
 * return (
 *   <div>
 *     {syncState.isSyncing && <Spinner />}
 *     {syncState.isOnline ? 'Online' : 'Offline'}
 *   </div>
 * );
 * ```
 */
export function useSyncEngineState() {
  const { currentWorkspace } = useWorkspace();

  if (!currentWorkspace?.id) {
    return {
      isRunning: false,
      isOnline: navigator.onLine,
      isSyncing: false,
      lastSyncAt: null,
      syncCount: 0,
      errorCount: 0,
      lastError: null,
    };
  }

  const syncEngine = getSyncEngine(currentWorkspace.id);
  const state = syncEngine.getState();

  // Return observable state as a plain object
  return {
    isRunning: state.isRunning.get(),
    isOnline: state.isOnline.get(),
    isSyncing: state.isSyncing.get(),
    lastSyncAt: state.lastSyncAt.get(),
    syncCount: state.syncCount.get(),
    errorCount: state.errorCount.get(),
    lastError: state.lastError.get(),
  };
}

/**
 * Hook to manually trigger sync
 *
 * @example
 * ```tsx
 * const syncNow = useManualSync();
 *
 * return (
 *   <button onClick={syncNow}>
 *     Sync Now
 *   </button>
 * );
 * ```
 */
export function useManualSync() {
  const { currentWorkspace } = useWorkspace();

  return async () => {
    if (!currentWorkspace?.id) {
      console.warn('[useManualSync] No workspace active');
      return;
    }

    const syncEngine = getSyncEngine(currentWorkspace.id);
    await syncEngine.syncNow();
  };
}
