import * as _legendapp_state from '@legendapp/state';
import { W as WorkspaceData } from '../types-B56Eq8pd.js';

/**
 * Auth state observable
 *
 * This should be set by the application to reflect the current authentication state.
 */
declare const isAuthenticated$: _legendapp_state.ObservableBoolean<boolean>;
/**
 * Sync state observable
 *
 * Tracks the current sync status across all workspaces.
 */
interface SyncStateManager {
    isSyncEnabled: boolean;
    isSyncing: boolean;
    pendingChanges: number;
    lastSyncTime: number | null;
    error: Error | null;
}
declare const syncState$: _legendapp_state.Observable<SyncStateManager>;
/**
 * Sync options
 */
interface SyncOptions {
    enabled: boolean;
    autoSync: boolean;
    syncInterval: number;
    retrySync: boolean;
    maxRetries: number;
    conflictResolution: 'local' | 'server' | 'latest';
}
/**
 * Sync manager class
 *
 * Handles conditional sync based on authentication state.
 * Automatically enables/disables sync when auth state changes.
 *
 * @example
 * ```ts
 * import { syncManager, isAuthenticated$ } from '@oxlayer/capabilities-state/sync';
 *
 * // Set auth state (usually from your auth context)
 * isAuthenticated$.set(true);
 *
 * // Configure sync options
 * syncManager.configure({
 *   autoSync: true,
 *   syncInterval: 60000,
 * });
 *
 * // Get sync status
 * const status = syncManager.getStatus();
 * console.log(status.isSyncing);
 * ```
 */
declare class SyncManager {
    private options;
    private syncTimer;
    private pendingSyncItems;
    constructor();
    /**
     * Configure sync options
     */
    configure(options: Partial<SyncOptions>): void;
    /**
     * Get current sync status
     */
    getStatus(): SyncStateManager;
    /**
     * Enable sync (usually called when user logs in)
     */
    enable(): Promise<void>;
    /**
     * Disable sync (usually called when user logs out)
     */
    disable(): void;
    /**
     * Sync all pending changes
     *
     * Apps should implement their own workspace detection logic.
     */
    syncAll(): Promise<void>;
    /**
     * Sync a specific workspace
     *
     * Apps should implement their own sync logic by overriding this method.
     *
     * @param workspaceId - The workspace ID to sync
     * @param syncFn - Optional sync function that performs the actual sync
     */
    syncWorkspace<T extends Record<string, unknown> = Record<string, unknown>>(workspaceId: string, syncFn?: (data: WorkspaceData<T>) => Promise<void>): Promise<void>;
    /**
     * Add a workspace to the pending sync queue
     *
     * @param workspaceId - The workspace ID to sync
     */
    queueSync(workspaceId: string): void;
    /**
     * Clear pending sync for a workspace
     *
     * @param workspaceId - The workspace ID
     */
    clearPendingSync(workspaceId: string): void;
    /**
     * Resolve a sync conflict
     *
     * @param localItem - Local version of the item
     * @param serverItem - Server version of the item
     * @returns The resolved item
     */
    resolveConflict<T extends {
        updatedAt: string;
    }>(localItem: T, serverItem: T): T;
    /**
     * Setup auth state watcher
     */
    private setupAuthWatcher;
    /**
     * Start auto-sync interval
     */
    private startAutoSync;
    /**
     * Stop auto-sync interval
     */
    private stopAutoSync;
}
/**
 * Default singleton instance of SyncManager
 */
declare const syncManager: SyncManager;
/**
 * Initialize sync with auth state
 *
 * Call this when your app initializes to connect sync to your auth system.
 *
 * @example
 * ```ts
 * import { initializeSync } from '@oxlayer/capabilities-state/sync';
 *
 * // In your app initialization
 * initializeSync({
 *   getIsAuthenticated: () => {
 *     const token = localStorage.getItem('token');
 *     return !!token;
 *   },
 *   onLogin: () => {
 *     // Trigger sync when user logs in
 *     syncManager.syncAll();
 *   },
 *   onLogout: () => {
 *     // Disable sync when user logs out
 *     syncManager.disable();
 *   },
 * });
 * ```
 */
interface SyncAuthConfig {
    getIsAuthenticated: () => boolean;
    onLogin?: () => void;
    onLogout?: () => void;
}
declare function initializeSync(config: SyncAuthConfig): void;

export { type SyncAuthConfig, SyncManager, type SyncOptions, type SyncStateManager, initializeSync, isAuthenticated$, syncManager, syncState$ };
