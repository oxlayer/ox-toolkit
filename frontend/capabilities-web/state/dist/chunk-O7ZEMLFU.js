import { observable } from '@legendapp/state';

// src/sync/sync-manager.ts
var isAuthenticated$ = observable(false);
var syncState$ = observable({
  isSyncEnabled: false,
  isSyncing: false,
  pendingChanges: 0,
  lastSyncTime: null,
  error: null
});
var DEFAULT_SYNC_OPTIONS = {
  enabled: true,
  autoSync: true,
  syncInterval: 3e4,
  // 30 seconds
  retrySync: true,
  maxRetries: 5,
  // 5 retries before giving up
  conflictResolution: "latest"
};
var SyncManager = class {
  options = { ...DEFAULT_SYNC_OPTIONS };
  syncTimer = null;
  pendingSyncItems = /* @__PURE__ */ new Set();
  constructor() {
    this.setupAuthWatcher();
  }
  /**
   * Configure sync options
   */
  configure(options) {
    this.options = { ...this.options, ...options };
    if (this.options.autoSync) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }
  /**
   * Get current sync status
   */
  getStatus() {
    return syncState$.get();
  }
  /**
   * Enable sync (usually called when user logs in)
   */
  async enable() {
    syncState$.isSyncEnabled.set(true);
    await this.syncAll();
  }
  /**
   * Disable sync (usually called when user logs out)
   */
  disable() {
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
  async syncAll() {
    if (!syncState$.isSyncEnabled.get()) {
      return;
    }
    syncState$.isSyncing.set(true);
    try {
      for (const workspaceId of this.pendingSyncItems) {
        await this.syncWorkspace(workspaceId);
      }
      syncState$.lastSyncTime.set(Date.now());
    } catch (error) {
      console.error("Sync failed:", error);
      syncState$.error.set(error);
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
  async syncWorkspace(workspaceId, syncFn) {
    if (!syncState$.isSyncEnabled.get()) {
      return;
    }
    try {
      if (syncFn) {
        await syncFn({});
      }
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
  queueSync(workspaceId) {
    this.pendingSyncItems.add(workspaceId);
    syncState$.pendingChanges.set(this.pendingSyncItems.size);
  }
  /**
   * Clear pending sync for a workspace
   *
   * @param workspaceId - The workspace ID
   */
  clearPendingSync(workspaceId) {
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
  resolveConflict(localItem, serverItem) {
    switch (this.options.conflictResolution) {
      case "local":
        return localItem;
      case "server":
        return serverItem;
      case "latest":
        return localItem.updatedAt > serverItem.updatedAt ? localItem : serverItem;
      default:
        return serverItem;
    }
  }
  /**
   * Setup auth state watcher
   */
  setupAuthWatcher() {
    isAuthenticated$.onChange((isAuthenticated) => {
      if (isAuthenticated) {
        this.enable();
      } else {
        this.disable();
      }
    });
  }
  /**
   * Start auto-sync interval
   */
  startAutoSync() {
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
  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
};
var syncManager = new SyncManager();
function initializeSync(config) {
  isAuthenticated$.set(config.getIsAuthenticated());
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
  }, 1e3);
}

export { SyncManager, initializeSync, isAuthenticated$, syncManager, syncState$ };
//# sourceMappingURL=chunk-O7ZEMLFU.js.map
//# sourceMappingURL=chunk-O7ZEMLFU.js.map