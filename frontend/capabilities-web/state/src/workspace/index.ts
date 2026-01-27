/**
 * @oxlayer/capabilities-state/workspace
 *
 * Workspace management exports
 *
 * NOTE: This module is kept for backward compatibility with existing apps.
 * New apps should implement their own workspace management using the
 * generic `WorkspaceData<T>` type and data store functions.
 */

// The workspace module is now deprecated. Apps should define their own
// workspace types and use the generic data store functions.

// Re-export types for convenience
export type { WorkspaceData } from '../types';

// Re-export data store functions
export {
  getWorkspaceDataKey,
  createWorkspaceDataStore,
  getWorkspaceDataStore,
  deleteWorkspaceDataStore,
} from '../data';
