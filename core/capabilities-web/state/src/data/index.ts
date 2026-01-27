/**
 * @oxlayer/capabilities-state/data
 *
 * Workspace data management exports
 *
 * Generic workspace data management - apps define their own entity types.
 */

// Types
export type { WorkspaceData } from '../types';

// Workspace data store
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
} from './workspace-data-store';
