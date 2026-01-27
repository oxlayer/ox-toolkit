/**
 * @oxlayer/capabilities-state/workspace
 *
 * Workspace manager for handling local workspace CRUD operations.
 */

import type { LocalWorkspace, WorkspaceType } from '../types';
import {
  localWorkspaces$,
  currentWorkspaceId$,
  createLocalWorkspaceObject,
  addLocalWorkspace,
  updateLocalWorkspace,
  deleteLocalWorkspace,
  getLocalWorkspace,
  getCurrentWorkspace,
} from './workspace-store';

/**
 * Options for creating a local workspace
 */
export interface CreateLocalWorkspaceOptions {
  name: string;
  type: WorkspaceType;
  ownerId: string;
  icon?: string;
  color?: string;
}

/**
 * Workspace manager class
 *
 * Provides a high-level API for managing local workspaces.
 *
 * @example
 * ```ts
 * import { WorkspaceManager } from '@oxlayer/capabilities-state/workspace';
 *
 * const manager = new WorkspaceManager();
 *
 * // Create a new local workspace
 * const workspace = manager.create({
 *   name: 'My Tasks',
 *   type: 'personal',
 *   ownerId: 'user_123',
 * });
 *
 * // Switch to a workspace
 * manager.switchTo('workspace_id');
 *
 * // Get current workspace
 * const current = manager.getCurrent();
 *
 * // Delete a workspace
 * manager.delete('workspace_id');
 * ```
 */
export class WorkspaceManager {
  /**
   * Create a new local workspace
   *
   * @param options - Workspace creation options
   * @returns The created workspace
   */
  create(options: CreateLocalWorkspaceOptions): LocalWorkspace {
    const workspace = createLocalWorkspaceObject(options);
    addLocalWorkspace(workspace);
    return workspace;
  }

  /**
   * Create a new local workspace and switch to it
   *
   * @param options - Workspace creation options
   * @returns The created workspace
   */
  createAndSwitch(options: CreateLocalWorkspaceOptions): LocalWorkspace {
    const workspace = this.create(options);
    this.switchTo(workspace.id);
    return workspace;
  }

  /**
   * Update an existing local workspace
   *
   * @param id - Workspace ID
   * @param updates - Fields to update
   * @returns True if updated, false if not found
   */
  update(
    id: string,
    updates: Partial<
      Omit<LocalWorkspace, 'id' | 'createdAt' | 'orderIndex'>
    >
  ): boolean {
    return updateLocalWorkspace(id, updates);
  }

  /**
   * Delete a local workspace
   *
   * @param id - Workspace ID
   * @returns True if deleted, false if not found
   */
  delete(id: string): boolean {
    return deleteLocalWorkspace(id);
  }

  /**
   * Switch to a different workspace
   *
   * @param id - Workspace ID to switch to
   * @returns The workspace that was switched to, or undefined if not found
   */
  switchTo(id: string): LocalWorkspace | undefined {
    const workspace = getLocalWorkspace(id);
    if (workspace) {
      currentWorkspaceId$.set(id);
    }
    return workspace;
  }

  /**
   * Get the current workspace
   *
   * @returns The current workspace, or undefined if none selected
   */
  getCurrent(): LocalWorkspace | undefined {
    return getCurrentWorkspace();
  }

  /**
   * Get all local workspaces
   *
   * @returns Array of all local workspaces
   */
  getAll(): LocalWorkspace[] {
    return localWorkspaces$.get();
  }

  /**
   * Get a workspace by ID
   *
   * @param id - Workspace ID
   * @returns The workspace, or undefined if not found
   */
  getById(id: string): LocalWorkspace | undefined {
    return getLocalWorkspace(id);
  }

  /**
   * Get workspaces filtered by owner
   *
   * @param ownerId - Owner ID to filter by
   * @returns Array of workspaces owned by the specified owner
   */
  getByOwner(ownerId: string): LocalWorkspace[] {
    const workspaces = localWorkspaces$.get();
    return workspaces.filter((ws) => ws.ownerId === ownerId);
  }

  /**
   * Get local-only workspaces (not synced to server)
   *
   * @returns Array of local-only workspaces
   */
  getLocalOnly(): LocalWorkspace[] {
    const workspaces = localWorkspaces$.get();
    return workspaces.filter((ws) => ws.isLocalOnly);
  }

  /**
   * Check if a workspace is local-only
   *
   * @param id - Workspace ID
   * @returns True if the workspace is local-only
   */
  isLocalOnly(id: string): boolean {
    const workspace = getLocalWorkspace(id);
    return workspace?.isLocalOnly ?? false;
  }

  /**
   * Mark a workspace as synced (no longer local-only)
   *
   * @param id - Workspace ID
   * @returns True if updated, false if not found
   */
  markAsSynced(id: string): boolean {
    return updateLocalWorkspace(id, {
      isLocalOnly: false,
      lastSyncedAt: new Date().toISOString(),
    });
  }

  /**
   * Reorder workspaces
   *
   * @param orderedIds - Array of workspace IDs in the desired order
   */
  reorder(orderedIds: string[]): void {
    const workspaces = localWorkspaces$.get();
    const workspaceMap = new Map(workspaces.map((ws) => [ws.id, ws]));

    const reordered = orderedIds
      .map((id) => workspaceMap.get(id))
      .filter((ws): ws is LocalWorkspace => ws !== undefined)
      .map((ws, index) => ({
        ...ws,
        orderIndex: index,
      }));

    // Add any workspaces not in the ordered list
    const remaining = workspaces.filter(
      (ws) => !orderedIds.includes(ws.id)
    );

    localWorkspaces$.set([...reordered, ...remaining]);
  }

  /**
   * Clear all local workspaces
   *
   * Warning: This will delete all local workspaces and their data.
   */
  clearAll(): void {
    localWorkspaces$.set([]);
    currentWorkspaceId$.set(null);
  }
}

/**
 * Default singleton instance of WorkspaceManager
 */
export const workspaceManager = new WorkspaceManager();
