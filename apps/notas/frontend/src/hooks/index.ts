/**
 * @oxlayer/todo-app/hooks
 *
 * Custom hooks exports
 */

// Offline data hooks (localStorage-based)
export {
  useOfflineTodos,
  useOfflineTodo,
  useOfflineProjects,
  useOfflineProject,
  useOfflineSections,
  useSyncOnLogin,
} from './use-offline-data';

// Offline mutation hooks (localStorage-based)
export {
  useOfflineCreateTodo,
  useOfflineUpdateTodo,
  useOfflineToggleTodo,
  useOfflineDeleteTodo,
  useOfflineCreateProject,
  useOfflineUpdateProject,
  useOfflineDeleteProject,
  useOfflineCreateSection,
  useOfflineUpdateSection,
  useOfflineDeleteSection,
} from './use-offline-mutations';

// Intent-first mutation hooks (recommended for new code)
export {
  useIntentCreateTodo,
  useIntentUpdateTodo,
  useIntentToggleTodo,
  useIntentDeleteTodo,
  useIntentCreateProject,
  useIntentUpdateProject,
  useIntentDeleteProject,
  useIntentCreateSection,
  useIntentUpdateSection,
  useIntentDeleteSection,
  useEntityIntentStatus,
} from './use-intent-mutations';

// Intent sync initialization
export {
  useIntentSyncInit,
  useSyncEngineState,
  useManualSync,
} from './use-intent-sync-init';
