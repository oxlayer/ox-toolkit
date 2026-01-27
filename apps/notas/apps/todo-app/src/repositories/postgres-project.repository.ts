/**
 * PostgreSQL Project Repository Implementation
 *
 * Extends PostgresRepositoryTemplate from @oxlayer/snippets.
 */

import { eq, and, sql, max } from 'drizzle-orm';
import type { ProjectRepository } from './project.repository.js';
import type { Project, ProjectFilters, ProjectProps } from '../domain/project.js';
import { Project as ProjectTable } from '../db/schema.js';
import { Project as ProjectEntity } from '../domain/project.js';
import { PostgresRepositoryTemplate } from '@oxlayer/snippets/repositories';

/**
 * PostgreSQL Project Repository
 */
export class PostgresProjectRepository
  extends PostgresRepositoryTemplate<Project, ProjectFilters, ProjectProps>
  implements ProjectRepository
{
  constructor(
    db: any,
    tracer?: unknown | null
  ) {
    super(db, tracer, { tableName: 'projects', dbSystem: 'postgresql', dbName: 'todo_app' });
  }

  /**
   * The Drizzle table schema for projects
   */
  protected override get tableSchema() {
    return ProjectTable;
  }

  /**
   * Map a database row to a Project entity
   */
  protected override mapRowToEntity(row: ProjectProps): Project {
    return ProjectEntity.fromPersistence(row);
  }

  /**
   * Map a Project entity to database props
   */
  protected override mapEntityToProps(entity: Project): ProjectProps {
    return entity.toPersistence();
  }

  /**
   * Apply filters to a query
   */
  protected override applyFilters(query: any, _filters: ProjectFilters): any {
    let conditions: any[] = [];

    if (_filters?.userId) {
      conditions.push(eq(ProjectTable.userId, _filters.userId));
    }

    if (_filters?.isInbox !== undefined) {
      conditions.push(eq(ProjectTable.isInbox, _filters.isInbox));
    }

    return conditions.length > 0
      ? query.where(and(...conditions))
      : query;
  }

  /**
   * Build query for finding all projects with filters
   */
  protected override buildFindAllQuery(filters: ProjectFilters): any {
    const query = this.db
      .select()
      .from(ProjectTable)
      .orderBy(sql`"order" ASC, created_at ASC`);

    return this.applyFilters(query, filters || {});
  }

  /**
   * Build query for counting projects with filters
   */
  protected override buildCountQuery(filters: ProjectFilters): any {
    const query = this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(ProjectTable);

    return this.applyFilters(query, filters || {});
  }

  /**
   * Find projects by user
   */
  async findByUser(userId: string): Promise<Project[]> {
    return this.findAll({ userId });
  }

  /**
   * Find inbox project for user
   */
  async findInboxByUser(userId: string): Promise<Project | null> {
    const result = await this.db
      .select()
      .from(ProjectTable)
      .where(and(
        eq(ProjectTable.userId, userId),
        eq(ProjectTable.isInbox, true)
      ))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result[0] as ProjectProps);
  }

  /**
   * Get max order for user
   */
  async getMaxOrder(userId: string): Promise<number> {
    const result = await this.db
      .select({ maxOrder: max(ProjectTable.order) })
      .from(ProjectTable)
      .where(eq(ProjectTable.userId, userId));

    return result[0]?.maxOrder ?? 0;
  }
}
