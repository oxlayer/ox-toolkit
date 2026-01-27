/**
 * Section Repository Interface
 */

import type { Section, SectionFilters } from '../domain/section.js';

export interface SectionRepository {
  /**
   * Find section by ID
   */
  findById(id: string): Promise<Section | null>;

  /**
   * Find all sections with optional filters
   */
  findAll(filters?: SectionFilters): Promise<Section[]>;

  /**
   * Find sections by project
   */
  findByProject(projectId: string): Promise<Section[]>;

  /**
   * Create a new section
   */
  create(section: Section): Promise<void>;

  /**
   * Update an existing section
   */
  update(section: Section): Promise<void>;

  /**
   * Delete a section
   */
  delete(id: string): Promise<void>;

  /**
   * Count sections
   */
  count(filters?: SectionFilters): Promise<number>;

  /**
   * Get max order for project
   */
  getMaxOrder(projectId: string): Promise<number>;
}
