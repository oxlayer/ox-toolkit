/**
 * Workspace Repository Interface
 */

import type { Workspace, WorkspaceFilters, WorkspaceProps } from '../domain/workspace.js';

export interface WorkspaceRepository {
  /**
   * Find workspace by ID
   */
  findById(id: string): Promise<Workspace | null>;

  /**
   * Find all workspaces with optional filters
   */
  findAll(filters?: WorkspaceFilters): Promise<Workspace[]>;

  /**
   * Find workspaces by owner
   */
  findByOwner(ownerId: string): Promise<Workspace[]>;

  /**
   * Create a new workspace
   */
  create(workspace: Workspace): Promise<void>;

  /**
   * Update an existing workspace
   */
  update(workspace: Workspace): Promise<void>;

  /**
   * Delete a workspace by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Count workspaces
   */
  count(filters?: WorkspaceFilters): Promise<number>;

  /**
   * Check if user has any workspaces
   */
  hasAny(ownerId: string): Promise<boolean>;

  /**
   * Get user's default workspace (first one or create personal)
   */
  getDefaultWorkspace(ownerId: string): Promise<Workspace>;

  /**
   * Set workspace as default (update orderIndex to 0)
   */
  setAsDefault(workspaceId: string, ownerId: string): Promise<void>;
}
