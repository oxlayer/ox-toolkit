/**
 * PostgreSQL Section Repository Implementation
 *
 * Extends PostgresRepositoryTemplate from @oxlayer/snippets.
 */

import { eq, and, sql, max } from 'drizzle-orm';
import type { SectionRepository } from './section.repository.js';
import type { Section, SectionFilters, SectionProps } from '../domain/section.js';
import { Section as SectionTable } from '../db/schema.js';
import { Section as SectionEntity } from '../domain/section.js';
import { PostgresRepositoryTemplate } from '@oxlayer/snippets/repositories';

/**
 * PostgreSQL Section Repository
 */
export class PostgresSectionRepository
  extends PostgresRepositoryTemplate<Section, SectionFilters, SectionProps>
  implements SectionRepository
{
  constructor(
    db: any,
    tracer?: unknown | null
  ) {
    super(db, tracer, { tableName: 'sections', dbSystem: 'postgresql', dbName: 'todo_app' });
  }

  /**
   * The Drizzle table schema for sections
   */
  protected override get tableSchema() {
    return SectionTable;
  }

  /**
   * Map a database row to a Section entity
   */
  protected override mapRowToEntity(row: SectionProps): Section {
    return SectionEntity.fromPersistence(row);
  }

  /**
   * Map a Section entity to database props
   */
  protected override mapEntityToProps(entity: Section): SectionProps {
    return entity.toPersistence();
  }

  /**
   * Apply filters to a query
   */
  protected override applyFilters(query: any, _filters: SectionFilters): any {
    let conditions: any[] = [];

    if (_filters?.projectId) {
      conditions.push(eq(SectionTable.projectId, _filters.projectId));
    }

    return conditions.length > 0
      ? query.where(and(...conditions))
      : query;
  }

  /**
   * Build query for finding all sections with filters
   */
  protected override buildFindAllQuery(filters: SectionFilters): any {
    const query = this.db
      .select()
      .from(SectionTable)
      .orderBy(sql`"order" ASC, created_at ASC`);

    return this.applyFilters(query, filters || {});
  }

  /**
   * Build query for counting sections with filters
   */
  protected override buildCountQuery(filters: SectionFilters): any {
    const query = this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(SectionTable);

    return this.applyFilters(query, filters || {});
  }

  /**
   * Find sections by project
   */
  async findByProject(projectId: string): Promise<Section[]> {
    return this.findAll({ projectId });
  }

  /**
   * Get max order for project
   */
  async getMaxOrder(projectId: string): Promise<number> {
    const result = await this.db
      .select({ maxOrder: max(SectionTable.order) })
      .from(SectionTable)
      .where(eq(SectionTable.projectId, projectId));

    return result[0]?.maxOrder ?? 0;
  }
}
