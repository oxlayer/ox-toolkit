/**
 * PostgreSQL Todo Repository Implementation
 *
 * This repository extends PostgresRepositoryTemplate from @oxlayer/snippets
 * which provides common CRUD operations with built-in span creation.
 *
 * @see @oxlayer/snippets/repositories
 */

import { eq, and, like, or, sql } from 'drizzle-orm';
import type { TodoRepository } from './todo.repository.js';
import type { Todo, TodoFilters, TodoProps } from '../domain/todo.js';
import { Todo as TodoTable } from '../db/schema.js';
import { Todo as TodoEntity } from '../domain/todo.js';
import { PostgresRepositoryTemplate } from '@oxlayer/snippets/repositories';

/**
 * PostgreSQL Todo Repository
 *
 * Extends PostgresRepositoryTemplate which provides:
 * - Built-in span creation for all database operations
 * - Common CRUD operations
 * - Filter application
 * - Row to entity mapping
 */
export class PostgresTodoRepository
  extends PostgresRepositoryTemplate<Todo, TodoFilters, TodoProps>
  implements TodoRepository
{
  constructor(
    db: any, // Drizzle database instance
    tracer?: unknown | null
  ) {
    super(db, tracer, { tableName: 'todos', dbSystem: 'postgresql', dbName: 'todo_app' });
  }

  /**
   * The Drizzle table schema for todos
   */
  protected override get tableSchema() {
    return TodoTable;
  }

  /**
   * Map a database row to a Todo entity
   */
  protected override mapRowToEntity(row: TodoProps): Todo {
    return TodoEntity.fromPersistence(row);
  }

  /**
   * Map a Todo entity to database props
   */
  protected override mapEntityToProps(entity: Todo): TodoProps {
    return entity.toPersistence();
  }

  /**
   * Apply filters to a query
   */
  protected override applyFilters(query: any, _filters: TodoFilters): any {
    let conditions: any[] = [];

    if (_filters?.status) {
      conditions.push(eq(TodoTable.status, _filters.status));
    }

    if (_filters?.userId) {
      conditions.push(eq(TodoTable.userId, _filters.userId));
    }

    // NEW: Workspace filter
    if (_filters?.workspaceId) {
      conditions.push(eq(TodoTable.workspaceId, _filters.workspaceId));
    }

    // NEW: CRM context filters
    if (_filters?.contextType) {
      conditions.push(eq(TodoTable.contextType, _filters.contextType));
    }

    if (_filters?.contextId) {
      conditions.push(eq(TodoTable.contextId, _filters.contextId));
    }

    if (_filters?.projectId) {
      conditions.push(eq(TodoTable.projectId, _filters.projectId));
    }

    if (_filters?.sectionId) {
      conditions.push(eq(TodoTable.sectionId, _filters.sectionId));
    }

    if (_filters?.search) {
      conditions.push(
        or(
          like(TodoTable.title, `%${_filters.search}%`),
          like(TodoTable.description || '', `%${_filters.search}%`)
        )
      );
    }

    return conditions.length > 0
      ? query.where(and(...conditions))
      : query;
  }

  /**
   * Build query for finding all todos with filters
   */
  protected override buildFindAllQuery(filters: TodoFilters): any {
    const query = this.db
      .select()
      .from(TodoTable)
      .orderBy(sql`created_at DESC`);

    return this.applyFilters(query, filters || {});
  }

  /**
   * Build query for counting todos with filters
   */
  protected override buildCountQuery(filters: TodoFilters): any {
    const query = this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(TodoTable);

    return this.applyFilters(query, filters || {});
  }

  /**
   * Additional method: Find todos by user
   * This is a domain-specific method not in the base template
   */
  async findByUser(userId: string): Promise<Todo[]> {
    return this.findAll({ userId });
  }

  /**
   * Override findById to use explicit eq() for proper Drizzle compatibility
   * The base template uses shorthand { id } which may not work correctly
   */
  override async findById(id: string): Promise<Todo | null> {
    const [row] = await this.db
      .select()
      .from(TodoTable)
      .where(eq(TodoTable.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    return this.mapRowToEntity(row);
  }
}
