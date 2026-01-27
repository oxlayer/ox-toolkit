/**
 * PostgreSQL User Repository Implementation
 */

import { eq, ilike, sql, and, or } from 'drizzle-orm';
import { PostgresRepositoryTemplate } from '@oxlayer/snippets/repositories';
import { User } from '@/db/schema.js';
import { UserRepository, UserFilters } from './user.repository.interface.js';
import { UserEntity } from '@/domain/index.js';

export class PostgresUserRepository
  extends PostgresRepositoryTemplate<UserEntity, UserFilters, any>
  implements UserRepository
{
  constructor(db: any, tracer?: unknown | null) {
    super(db, tracer, {
      tableName: 'users',
      dbSystem: 'postgresql',
      dbName: 'alo_manager',
    });
  }

  protected override get tableSchema() {
    return User;
  }

  protected override mapRowToEntity(row: any): UserEntity {
    return UserEntity.fromPersistence(row);
  }

  protected override mapEntityToProps(entity: UserEntity): any {
    return entity.toPersistence();
  }

  protected override applyFilters(query: any, filters: UserFilters): any {
    let q = super.applyFilters(query, filters);

    if (filters?.establishmentId) {
      q = q.where(eq(User.establishmentId, filters.establishmentId));
    }

    if (filters?.role) {
      q = q.where(eq(User.role, filters.role));
    }

    if (filters?.isActive !== undefined) {
      q = q.where(eq(User.isActive, filters.isActive));
    }

    if (filters?.search) {
      q = q.where(
        or(
          ilike(User.name, `%${filters.search}%`),
          ilike(User.email, `%${filters.search}%`)
        )
      );
    }

    return q;
  }

  protected override applySorting(query: any): any {
    return query.orderBy(sql`name ASC`);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.db
      .select()
      .from(this.tableSchema)
      .where(eq(User.email, email.toLowerCase()))
      .limit(1);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }
}
