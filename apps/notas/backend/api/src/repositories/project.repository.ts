/**
 * Project Repository Interface
 */

import type { Project, ProjectFilters } from '../domain/project.js';

export interface ProjectRepository {
  /**
   * Find project by ID
   */
  findById(id: string): Promise<Project | null>;

  /**
   * Find all projects with optional filters
   */
  findAll(filters?: ProjectFilters): Promise<Project[]>;

  /**
   * Find projects by user
   */
  findByUser(userId: string): Promise<Project[]>;

  /**
   * Find inbox project for user
   */
  findInboxByUser(userId: string): Promise<Project | null>;

  /**
   * Create a new project
   */
  create(project: Project): Promise<void>;

  /**
   * Update an existing project
   */
  update(project: Project): Promise<void>;

  /**
   * Delete a project
   */
  delete(id: string): Promise<void>;

  /**
   * Count projects
   */
  count(filters?: ProjectFilters): Promise<number>;

  /**
   * Get max order for user
   */
  getMaxOrder(userId: string): Promise<number>;
}
