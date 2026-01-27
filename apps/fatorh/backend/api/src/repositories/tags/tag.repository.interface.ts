/**
 * Tag Repository Interface
 */

import { Tag, CreateTagInput, UpdateTagInput, TagFilters } from '../../domain/tags/index.js';

export interface ITagRepository {
  /**
   * Create a new tag
   */
  create(data: CreateTagInput & { id?: string }): Promise<Tag>;

  /**
   * Find tag by ID
   */
  findById(id: string): Promise<Tag | null>;

  /**
   * Find tags by filters
   */
  find(filters: TagFilters): Promise<Tag[]>;

  /**
   * Find tags by workspace
   */
  findByWorkspace(workspaceId: string): Promise<Tag[]>;

  /**
   * Find primary tags by workspace
   */
  findPrimaryByWorkspace(workspaceId: string): Promise<Tag[]>;

  /**
   * Get unique tag keys by workspace
   */
  getKeysByWorkspace(workspaceId: string): Promise<string[]>;

  /**
   * Get unique tag values for a key by workspace
   */
  getValuesByKey(workspaceId: string, key: string): Promise<string[]>;

  /**
   * Update tag
   */
  update(id: string, data: UpdateTagInput): Promise<Tag>;

  /**
   * Delete tag
   */
  delete(id: string): Promise<void>;

  /**
   * Check if tag exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Find tag by workspace, key, and value
   */
  findByWorkspaceKeyAndValue(workspaceId: string, key: string, value: string): Promise<Tag | null>;
}
