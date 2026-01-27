/**
 * PostgreSQL Service Provider Repository Implementation
 */

import { eq, ilike, sql, and, or } from 'drizzle-orm';
import { PostgresRepositoryTemplate } from '@oxlayer/snippets/repositories';
import { ServiceProvider } from '@/db/schema.js';
import { ServiceProviderRepository, ServiceProviderFilters } from './service-provider.repository.interface.js';
import { ServiceProviderEntity } from '@/domain/index.js';

export class PostgresServiceProviderRepository
  extends PostgresRepositoryTemplate<ServiceProviderEntity, ServiceProviderFilters, any>
  implements ServiceProviderRepository
{
  constructor(db: any, tracer?: unknown | null) {
    super(db, tracer, {
      tableName: 'service_providers',
      dbSystem: 'postgresql',
      dbName: 'alo_manager',
    });
  }

  protected override get tableSchema() {
    return ServiceProvider;
  }

  protected override mapRowToEntity(row: any): ServiceProviderEntity {
    return ServiceProviderEntity.fromPersistence(row);
  }

  protected override mapEntityToProps(entity: ServiceProviderEntity): any {
    return entity.toPersistence();
  }

  protected override applyFilters(query: any, filters: ServiceProviderFilters): any {
    let q = super.applyFilters(query, filters);

    if (filters?.categoryId) {
      q = q.where(eq(ServiceProvider.categoryId, filters.categoryId));
    }

    if (filters?.available !== undefined) {
      q = q.where(eq(ServiceProvider.available, filters.available));
    }

    if (filters?.isActive !== undefined) {
      q = q.where(eq(ServiceProvider.isActive, filters.isActive));
    }

    if (filters?.search) {
      q = q.where(
        or(
          ilike(ServiceProvider.name, `%${filters.search}%`),
          ilike(ServiceProvider.email, `%${filters.search}%`),
          ilike(ServiceProvider.phone, `%${filters.search}%`)
        )
      );
    }

    return q;
  }

  protected override applySorting(query: any): any {
    return query.orderBy(sql`name ASC`);
  }

  async findByEmail(email: string): Promise<ServiceProviderEntity | null> {
    const result = await this.db
      .select()
      .from(this.tableSchema)
      .where(eq(ServiceProvider.email, email.toLowerCase()))
      .limit(1);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }
}
