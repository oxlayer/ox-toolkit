/**
 * Repository Template
 *
 * A template for creating PostgreSQL repositories with built-in tracing support.
 * Repositories handle data persistence and retrieval for entities.
 *
 * @example
 * ```typescript
 * import { withDbSpan } from '@oxlayer/capabilities-telemetry';
 *
 * export class PostgresTodoRepository implements TodoRepository {
 *   constructor(
 *     private db: Database,
 *     private tracer?: unknown | null
 *   ) {}
 *
 *   async findById(id: string): Promise<Todo | null> {
 *     return withDbSpan(
 *       this.tracer as any || null,
 *       'select',
 *       'todos',
 *       async (span) => {
 *         span?.setAttribute('db.id', id);
 *         const [row] = await this.db.select().from('todos').where({ id }).limit(1);
 *         if (!row) return null;
 *         return Todo.fromPersistence(row);
 *       }
 *     );
 *   }
 *
 *   async create(entity: Todo): Promise<void> {
 *     return withDbSpan(
 *       this.tracer as any || null,
 *       'insert',
 *       'todos',
 *       async () => {
 *         await this.db.insert('todos').values(entity.toPersistence());
 *       }
 *     );
 *   }
 *
 *   async update(entity: Todo): Promise<void> {
 *     return withDbSpan(
 *       this.tracer as any || null,
 *       'update',
 *       'todos',
 *       async (span) => {
 *         span?.setAttribute('db.id', entity.id);
 *         await this.db.update('todos').set(entity.toPersistence()).where({ id: entity.id });
 *       }
 *     );
 *   }
 *
 *   async delete(id: string): Promise<void> {
 *     return withDbSpan(
 *       this.tracer as any || null,
 *       'delete',
 *       'todos',
 *       async (span) => {
 *         span?.setAttribute('db.id', id);
 *         await this.db.deleteFrom('todos').where({ id });
 *       }
 *     );
 *   }
 *
 *   async findAll(filters: TodoFilters): Promise<Todo[]> {
 *     return withDbSpan(
 *       this.tracer as any || null,
 *       'select',
 *       'todos',
 *       async (span) => {
 *         let query = this.db.select().from('todos');
 *         if (filters.status) query = query.where({ status: filters.status });
 *         if (filters.userId) query = query.where({ userId: filters.userId });
 *         if (filters.search) query = query.where('title', 'like', `%${filters.search}%`);
 *         const rows = await query;
 *         return rows.map(row => Todo.fromPersistence(row));
 *       }
 *     );
 *   }
 * }
 * ```
 */

import { withDbSpan } from '@oxlayer/capabilities-telemetry';
import { sql } from 'drizzle-orm';

/**
 * Base class for PostgreSQL repositories with automatic tracing
 *
 * Provides common CRUD operations with built-in span creation
 * following OpenTelemetry semantic conventions for database operations.
 *
 * @see https://opentelemetry.io/docs/reference/specification/trace/semantic_conventions/database/
 */
export abstract class PostgresRepositoryTemplate<TEntity, TFilters, TProps> {
  constructor(
    protected readonly db: any,
    protected readonly tracer?: unknown | null,
    protected readonly config?: {
      tableName?: string;
      dbSystem?: string;
      dbName?: string;
    }
  ) {}

  /**
   * The Drizzle table schema object (must be overridden by subclass)
   * This is required for Drizzle ORM operations
   */
  protected abstract get tableSchema(): any;

  /**
   * The table name for this repository
   * Used for span attributes and logging
   */
  protected get tableName(): string {
    return this.config?.tableName || this.getTableNameFromEntity();
  }

  /**
   * Get table name from entity class name
   * Override for custom naming
   */
  protected getTableNameFromEntity(): string {
    return 'entities';
  }

  /**
   * Database system identifier for spans
   */
  protected get dbSystem(): string {
    return this.config?.dbSystem || 'postgresql';
  }

  /**
   * Database name for spans
   */
  protected get dbName(): string {
    return this.config?.dbName || 'default';
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<TEntity | null> {
    return withDbSpan(
      this.tracer as any || null,
      'select',
      this.tableName,
      async (span) => {
        const [row] = await this.db
          .select()
          .from(this.tableSchema)
          .where({ id })
          .limit(1);

        if (!row) {
          span?.setAttribute('db.id', id);
          span?.setAttribute('db.found', false);
          return null;
        }

        span?.setAttribute('db.id', id);
        span?.setAttribute('db.found', true);
        return this.mapRowToEntity(row);
      },
      this.dbName,
      this.dbSystem
    );
  }

  /**
   * Find all entities matching filters
   */
  async findAll(filters: TFilters = {} as TFilters): Promise<TEntity[]> {
    return withDbSpan(
      this.tracer as any || null,
      'select',
      this.tableName,
      async (span) => {
        const query = this.buildFindAllQuery(filters);
        const rows = await query;

        span?.setAttribute('db.row_count', rows.length);

        return rows.map((row: any) => this.mapRowToEntity(row));
      },
      this.dbName,
      this.dbSystem
    );
  }

  /**
   * Count entities matching filters
   */
  async count(filters: TFilters = {} as TFilters): Promise<number> {
    return withDbSpan(
      this.tracer as any || null,
      'select',
      this.tableName,
      async (span) => {
        const query = this.buildCountQuery(filters);
        const [result] = await query;

        const count = typeof result?.count === 'number' ? result.count : 0;
        span?.setAttribute('db.count', count);

        return count;
      },
      this.dbName,
      this.dbSystem
    );
  }

  /**
   * Create a new entity
   */
  async create(entity: TEntity): Promise<void> {
    return withDbSpan(
      this.tracer as any || null,
      'insert',
      this.tableName,
      async (span) => {
        const props = this.mapEntityToProps(entity);
        const entityId = (props as any).id;

        // Perform database operation BEFORE setting any span attributes
        // to avoid triggering OpenTelemetry serialization during Drizzle query building
        await this.db
          .insert(this.tableSchema)
          .values(props);

        // Set attributes AFTER the database operation completes
        span?.setAttribute('db.entity_id', entityId);
        span?.setAttribute('db.inserted', true);
      },
      this.dbName,
      this.dbSystem
    );
  }

  /**
   * Update an existing entity
   */
  async update(entity: TEntity): Promise<void> {
    return withDbSpan(
      this.tracer as any || null,
      'update',
      this.tableName,
      async (span) => {
        const props = this.mapEntityToProps(entity);
        const id = (props as any).id;

        // Perform database operation BEFORE setting any span attributes
        await this.db
          .update(this.tableSchema)
          .set(props)
          .where({ id });

        // Set attributes AFTER the database operation completes
        span?.setAttribute('db.id', id);
        span?.setAttribute('db.updated', true);
      },
      this.dbName,
      this.dbSystem
    );
  }

  /**
   * Delete an entity by ID
   */
  async delete(id: string): Promise<void> {
    return withDbSpan(
      this.tracer as any || null,
      'delete',
      this.tableName,
      async (span) => {
        // Perform database operation BEFORE setting any span attributes
        await this.db
          .deleteFrom(this.tableSchema)
          .where({ id });

        // Set attributes AFTER the database operation completes
        span?.setAttribute('db.id', id);
        span?.setAttribute('db.deleted', true);
      },
      this.dbName,
      this.dbSystem
    );
  }

  /**
   * Check if an entity exists by ID
   */
  async exists(id: string): Promise<boolean> {
    return withDbSpan(
      this.tracer as any || null,
      'select',
      this.tableName,
      async (span) => {
        const [result] = await this.db
          .select({ exists: 1 })
          .from(this.tableSchema)
          .where({ id })
          .limit(1);

        const exists = !!result;
        span?.setAttribute('db.exists', exists);

        return exists;
      },
      this.dbName,
      this.dbSystem
    );
  }

  /**
   * Build query for findAll with filters
   * Override to implement custom filter logic
   */
  protected buildFindAllQuery(filters: TFilters): any {
    const query = this.db.select().from(this.tableSchema);
    return this.applyFilters(query, filters);
  }

  /**
   * Build query for count with filters
   * Override to implement custom filter logic
   */
  protected buildCountQuery(filters: TFilters): any {
    const query = this.db.select({ count: sql`count(*)::int` }).from(this.tableSchema);
    return this.applyFilters(query, filters);
  }

  /**
   * Apply filters to a query
   * Override to implement custom filter logic
   */
  protected applyFilters(query: any, _filters: TFilters): any {
    // Default implementation - override for custom filtering
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return query;
  }

  /**
   * Map a database row to an entity
   * Override this method to implement custom mapping
   */
  protected abstract mapRowToEntity(row: TProps): TEntity;

  /**
   * Map an entity to database props
   * Override this method to implement custom mapping
   */
  protected abstract mapEntityToProps(entity: TEntity): TProps;
}

/**
 * Template for repositories with soft delete support
 */
export abstract class SoftDeleteRepositoryTemplate<
  TEntity,
  TFilters,
  TProps
> extends PostgresRepositoryTemplate<TEntity, TFilters, TProps> {
  /**
   * Soft delete an entity by setting deleted_at timestamp
   */
  async softDelete(id: string): Promise<void> {
    return withDbSpan(
      this.tracer as any || null,
      'update',
      this.tableName,
      async (span) => {
        span?.setAttribute('db.id', id);

        await this.db
          .update(this.tableName)
          .set({ deleted_at: new Date() })
          .where({ id });

        span?.setAttribute('db.soft_deleted', true);
      },
      this.dbName,
      this.dbSystem
    );
  }

  /**
   * Restore a soft-deleted entity
   */
  async restore(id: string): Promise<void> {
    return withDbSpan(
      this.tracer as any || null,
      'update',
      this.tableName,
      async (span) => {
        span?.setAttribute('db.id', id);

        await this.db
          .update(this.tableName)
          .set({ deleted_at: null })
          .where({ id });

        span?.setAttribute('db.restored', true);
      },
      this.dbName,
      this.dbSystem
    );
  }

  /**
   * Build query that excludes soft-deleted entities
   */
  protected applyFilters(query: any, _filters: TFilters): any {
    // Always exclude soft-deleted entities unless explicitly requested
    return query.whereNull('deleted_at');
  }
}

/**
 * Template for repositories with user ownership
 */
export abstract class OwnedRepositoryTemplate<
  TEntity,
  TFilters,
  TProps
> extends PostgresRepositoryTemplate<TEntity, TFilters, TProps> {
  /**
   * Find all entities for a specific user
   */
  async findByUser(userId: string, filters: TFilters = {} as TFilters): Promise<TEntity[]> {
    return withDbSpan(
      this.tracer as any || null,
      'select',
      this.tableName,
      async (span) => {
        span?.setAttribute('db.user_id', userId);

        let query = this.db.select().from(this.tableName).where({ user_id: userId });
        query = this.applyFilters(query, filters);

        const rows = await query;
        span?.setAttribute('db.row_count', rows.length);

        return rows.map((row: any) => this.mapRowToEntity(row));
      },
      this.dbName,
      this.dbSystem
    );
  }

  /**
   * Count entities for a specific user
   */
  async countByUser(userId: string, filters: TFilters = {} as TFilters): Promise<number> {
    return withDbSpan(
      this.tracer as any || null,
      'select',
      this.tableName,
      async (span) => {
        span?.setAttribute('db.user_id', userId);

        let query = this.db.select({ count: 'count(*)' }).from(this.tableName).where({ user_id: userId });
        query = this.applyFilters(query, filters);

        const [result] = await query;
        const count = typeof result?.count === 'number' ? result.count : 0;

        span?.setAttribute('db.count', count);

        return count;
      },
      this.dbName,
      this.dbSystem
    );
  }
}
