/**
 * @oxlayer/capabilities-state/sync
 *
 * Sync manager for handling conditional sync based on authentication state.
 * Enables sync when user is authenticated, disables when anonymous.
 */

import { observable } from '@legendapp/state';
import type { WorkspaceData } from '../types';

/**
 * Auth state observable
 *
 * This should be set by the application to reflect the current authentication state.
 */
export const isAuthenticated$ = observable<boolean>(false);

/**
 * Sync state observable
 *
 * Tracks the current sync status across all workspaces.
 */
export interface SyncStateManager {
  isSyncEnabled: boolean;
  isSyncing: boolean;
  pendingChanges: number;
  lastSyncTime: number | null;
  error: Error | null;
}

export const syncState$ = observable<SyncStateManager>({
  isSyncEnabled: false,
  isSyncing: false,
  pendingChanges: 0,
  lastSyncTime: null,
  error: null,
});

/**
 * Sync options
 */
export interface SyncOptions {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number;
  retrySync: boolean;
  maxRetries: number;
  conflictResolution: 'local' | 'server' | 'latest';
}

/**
 * Default sync options
 */
const DEFAULT_SYNC_OPTIONS: SyncOptions = {
  enabled: true,
  autoSync: true,
  syncInterval: 30000, // 30 seconds
  retrySync: true,
  maxRetries: 5, // 5 retries before giving up
  conflictResolution: 'latest',
};

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
export class SyncManager {
  private options: SyncOptions = { ...DEFAULT_SYNC_OPTIONS };
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private pendingSyncItems = new Set<string>();

  constructor() {
    // Watch auth state changes
    this.setupAuthWatcher();
  }

  /**
   * Configure sync options
   */
  configure(options: Partial<SyncOptions>): void {
    this.options = { ...this.options, ...options };

    // Restart auto-sync if needed
    if (this.options.autoSync) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStateManager {
    return syncState$.get();
  }

  /**
   * Enable sync (usually called when user logs in)
   */
  async enable(): Promise<void> {
    syncState$.isSyncEnabled.set(true);

    // Trigger initial sync
    await this.syncAll();
  }

  /**
   * Disable sync (usually called when user logs out)
   */
  disable(): void {
    syncState$.isSyncEnabled.set(false);
    this.stopAutoSync();
    this.pendingSyncItems.clear();
    syncState$.pendingChanges.set(0);
  }

  /**
   * Sync all pending changes
   *
   * Apps should implement their own workspace detection logic.
   */
  async syncAll(): Promise<void> {
    if (!syncState$.isSyncEnabled.get()) {
      return;
    }

    syncState$.isSyncing.set(true);

    try {
      // Apps should override this method with their own sync logic
      // This is a placeholder that iterates over queued workspace IDs
      for (const workspaceId of this.pendingSyncItems) {
        await this.syncWorkspace(workspaceId);
      }

      syncState$.lastSyncTime.set(Date.now());
    } catch (error) {
      console.error('Sync failed:', error);
      syncState$.error.set(error as Error);
    } finally {
      syncState$.isSyncing.set(false);
    }
  }

  /**
   * Sync a specific workspace
   *
   * Apps should implement their own sync logic by overriding this method.
   *
   * @param workspaceId - The workspace ID to sync
   * @param syncFn - Optional sync function that performs the actual sync
   */
  async syncWorkspace<T extends Record<string, unknown> = Record<string, unknown>>(
    workspaceId: string,
    syncFn?: (data: WorkspaceData<T>) => Promise<void>
  ): Promise<void> {
    if (!syncState$.isSyncEnabled.get()) {
      return;
    }

    try {
      if (syncFn) {
        // App-provided sync function
        // The app is responsible for getting the workspace data and calling syncFn
        await syncFn({} as WorkspaceData<T>);
      }

      // Mark workspace as synced
      this.pendingSyncItems.delete(workspaceId);
      syncState$.pendingChanges.set(this.pendingSyncItems.size);
      syncState$.lastSyncTime.set(Date.now());
    } catch (error) {
      console.error(`Failed to sync workspace ${workspaceId}:`, error);
      throw error;
    }
  }

  /**
   * Add a workspace to the pending sync queue
   *
   * @param workspaceId - The workspace ID to sync
   */
  queueSync(workspaceId: string): void {
    this.pendingSyncItems.add(workspaceId);
    syncState$.pendingChanges.set(this.pendingSyncItems.size);
  }

  /**
   * Clear pending sync for a workspace
   *
   * @param workspaceId - The workspace ID
   */
  clearPendingSync(workspaceId: string): void {
    this.pendingSyncItems.delete(workspaceId);
    syncState$.pendingChanges.set(this.pendingSyncItems.size);
  }

  /**
   * Resolve a sync conflict
   *
   * @param localItem - Local version of the item
   * @param serverItem - Server version of the item
   * @returns The resolved item
   */
  resolveConflict<T extends { updatedAt: string }>(
    localItem: T,
    serverItem: T
  ): T {
    switch (this.options.conflictResolution) {
      case 'local':
        return localItem;
      case 'server':
        return serverItem;
      case 'latest':
        return localItem.updatedAt > serverItem.updatedAt ? localItem : serverItem;
      default:
        return serverItem;
    }
  }

  /**
   * Setup auth state watcher
   */
  private setupAuthWatcher(): void {
    // Watch for auth state changes and enable/disable sync accordingly
    const unobserve = isAuthenticated$.onChange((isAuthenticated) => {
      if (isAuthenticated) {
        this.enable();
      } else {
        this.disable();
      }
    });

    // Store unobserve for cleanup (not implemented in this simple version)
    // In a real app, you'd want to return a cleanup function
  }

  /**
   * Start auto-sync interval
   */
  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.options.autoSync && syncState$.isSyncEnabled.get()) {
        this.syncAll().catch(console.error);
      }
    }, this.options.syncInterval);
  }

  /**
   * Stop auto-sync interval
   */
  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
}

/**
 * Default singleton instance of SyncManager
 */
export const syncManager = new SyncManager();

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
export interface SyncAuthConfig {
  getIsAuthenticated: () => boolean;
  onLogin?: () => void;
  onLogout?: () => void;
}

export function initializeSync(config: SyncAuthConfig): void {
  // Set initial auth state
  isAuthenticated$.set(config.getIsAuthenticated());

  // Set up auth state polling (simple approach)
  // In a real app, you'd integrate more tightly with your auth context
  setInterval(() => {
    const isAuthenticated = config.getIsAuthenticated();
    const current = isAuthenticated$.get();

    if (isAuthenticated !== current) {
      isAuthenticated$.set(isAuthenticated);

      if (isAuthenticated) {
        config.onLogin?.();
      } else {
        config.onLogout?.();
      }
    }
  }, 1000);
}
