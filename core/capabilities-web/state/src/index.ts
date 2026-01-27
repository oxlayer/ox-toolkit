/**
 * @oxlayer/capabilities-state
 *
 * Local-first state management with Legend-State for OxLayer apps.
 *
 * This package is domain-agnostic. It can be used for:
 * - Todo apps
 * - CRM systems
 * - ERP/Accounting
 * - Ecommerce
 * - Chat/Messaging
 * - Food delivery
 * - Any user-action-driven application
 *
 * @example
 * ```ts
 * // Intent-first architecture (recommended)
 * import { recordIntent, IntentPresets } from '@oxlayer/capabilities-state';
 *
 * // Record a user action
 * recordIntent('workspace_id', {
 *   domain: 'todo',
 *   type: 'create',
 *   entityType: 'task',
 *   entityId: 'temp_123',
 *   payload: { title: 'Buy milk', completed: false },
 *   policy: IntentPresets.optimistic,
 * });
 *
 * // Data management
 * import { getWorkspaceDataStore } from '@oxlayer/capabilities-state/data';
 *
 * const dataStore = getWorkspaceDataStore('workspace_id', {
 *   initialEntities: {
 *     todos: [],
 *     projects: [],
 *   },
 * });
 *
 * // Sync management
 * import { syncManager, isAuthenticated$ } from '@oxlayer/capabilities-state/sync';
 *
 * isAuthenticated$.set(true);
 * await syncManager.syncAll();
 *
 * // Export/Import
 * import { exportManager } from '@oxlayer/capabilities-state/export';
 *
 * await exportManager.downloadExport('workspace_id', {
 *   getWorkspace: (id) => myWorkspaces.find(w => w.id === id),
 * });
 * ```
 */

// Core types
export type {
  WorkspaceData,
  WorkspaceExport,
  SyncStatus,
  SyncOptions,
  DeliveryStatus,
  UserIntent,
  EntitySyncStatus,
  IntentActionType,
} from './types';

// Data exports
export {
  getWorkspaceDataKey,
  createWorkspaceDataStore,
  getWorkspaceDataStore,
  deleteWorkspaceDataStore,
  getWorkspaceDataSyncState,
  activeWorkspaceData$,
  switchActiveWorkspaceData,
  hasWorkspaceDataStore,
  getWorkspaceDataStoreIds,
} from './data';

// Sync exports
export {
  isAuthenticated$,
  syncState$,
  syncManager,
  SyncManager,
  initializeSync,
  type SyncStateManager,
  type SyncOptions as SyncManagerOptions,
  type SyncAuthConfig,
} from './sync';

// Export/Import exports
export {
  exportManager,
  ExportManager,
  WORKSPACE_EXPORT_VERSION,
  importManager,
  ImportManager,
  type ImportOptions,
  type ImportResult,
} from './export';

// Persist exports
export {
  createLocalStorageAdapter,
  createSqliteAdapter,
  type SqliteAdapter,
} from './persist';

// SQLite WASM exports
export {
  sqliteStorage,
  createSqliteWasmAdapter,
  sharedSqliteStorage,
  isSharedWorkerSupported,
  getAutoSqliteStorage,
  type SQLiteStorageAdapter,
  type SQLiteWasmConfig,
  type SharedSQLiteAdapter,
} from './persist/sqlite-wasm';

// Offline storage exports
export {
  getOfflineStorage,
  getItem as getOfflineStorageItem,
  setItem as setOfflineStorageItem,
  removeItem as removeOfflineStorageItem,
  getAllKeys as getOfflineStorageAllKeys,
  clearStorage as clearOfflineStorage,
  initStorage as initOfflineStorage,
  type OfflineStorageConfig,
  type StorageReadResult,
  type StorageReadOptions,
  type StorageWriteOptions,
  type StorageSource,
} from './persist/offline-storage';

// Pure storage exports (Intent-native persistence)
export {
  getPureStorage,
  getStoredValue,
  setStoredValue,
  deleteStoredValue,
  getStoredKeys,
  clearStoredValues,
  flushStorage,
  type StoredValue,
  type StoredResult,
  type PureStorageConfig,
} from './persist/pure-storage';

// Intent exports (Intent-first architecture)
export {
  recordIntent,
  recordIntentSimple,
  updateIntentStatus,
  getPendingIntents,
  getFailedIntents,
  getFailedIntentsObservable,
  getFailedIntentsCountObservable,
  clearIntents,
  deleteIntentLog,
  getEntityIntentStatus,
  getIntentsByDomain,
  getIntentsByEntity,
  getIntentLog,
  getIntentLogKey,
  generateIntentId,
  createIntentLog,
  getSyncEngine,
  stopSyncEngine,
  registerApiAdapter,
  unregisterApiAdapter,
  registerApiAdapters,
  type IntentLogEntry,
  type IntentLogState,
  type SyncEngine,
  type SyncEngineConfig,
  type SyncEngineState,
  type ApiAdapter,
} from './intent';

// Policy exports
export {
  type IntentPolicy,
  type IntentUxPolicy,
  type IntentDeliveryPolicy,
  type IntentRetryPolicy,
  type IntentConflictPolicy,
  type WriteMode,
  IntentPresets,
  getDefaultPolicy,
  normalizePolicy,
  isOptimistic,
  requiresImmediateDelivery,
  allowsAutoRetry,
  allowsLocalPersistence,
  isApiFirst,
  isLocalOnly,
  allowsApiSync,
  getRetryDelay,
  areIntentsInConflict,
  resolveConflict,
} from './intent/policy';

// Local-only mode exports
export {
  initLocalOnlyMode,
  exportLocalWorkspace,
  importLocalWorkspace,
  verifyExport,
  createLocalOnlyPolicy,
  isLocalOnlyMode,
  exportToJson,
  importFromJson,
  type LocalOnlyConfig,
  type LocalExportOptions,
  type LocalImportResult,
} from './local-only';
