/**
 * Template Repository Interface
 */

import { Template, CreateTemplateInput, UpdateTemplateInput, TemplateFilters } from '../../domain/templates/index.js';

export interface ITemplateRepository {
  /**
   * Create a new template
   */
  create(data: CreateTemplateInput & { id?: string }): Promise<Template>;

  /**
   * Find template by ID
   */
  findById(id: string): Promise<Template | null>;

  /**
   * Find templates by filters
   */
  find(filters: TemplateFilters): Promise<Template[]>;

  /**
   * Find templates by workspace
   */
  findByWorkspace(workspaceId: string): Promise<Template[]>;

  /**
   * Find templates by type
   */
  findByType(type: string): Promise<Template[]>;

  /**
   * Find active templates by workspace
   */
  findActiveByWorkspace(workspaceId: string): Promise<Template[]>;

  /**
   * Update template
   */
  update(id: string, data: UpdateTemplateInput): Promise<Template>;

  /**
   * Delete template
   */
  delete(id: string): Promise<void>;

  /**
   * Check if template exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Find template by external ID
   */
  findByExternalId(externalId: string): Promise<Template | null>;
}
