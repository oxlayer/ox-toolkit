/**
 * PostgreSQL Service Provider Category Repository Implementation
 */

import { ilike, sql } from 'drizzle-orm';
import { PostgresRepositoryTemplate } from '@oxlayer/snippets/repositories';
import { ServiceProviderCategory } from '@/db/schema.js';
import { ServiceProviderCategoryRepository, ServiceProviderCategoryFilters } from './service-provider-category.repository.interface.js';
import { ServiceProviderCategoryEntity } from '@/domain/index.js';

export class PostgresServiceProviderCategoryRepository
  extends PostgresRepositoryTemplate<ServiceProviderCategoryEntity, ServiceProviderCategoryFilters, any>
  implements ServiceProviderCategoryRepository
{
  constructor(db: any, tracer?: unknown | null) {
    super(db, tracer, {
      tableName: 'service_provider_categories',
      dbSystem: 'postgresql',
      dbName: 'alo_manager',
    });
  }

  protected override get tableSchema() {
    return ServiceProviderCategory;
  }

  protected override mapRowToEntity(row: any): ServiceProviderCategoryEntity {
    return ServiceProviderCategoryEntity.fromPersistence(row);
  }

  protected override mapEntityToProps(entity: ServiceProviderCategoryEntity): any {
    return entity.toPersistence();
  }

  protected override applyFilters(query: any, filters: ServiceProviderCategoryFilters): any {
    let q = super.applyFilters(query, filters);

    if (filters?.search) {
      q = q.where(
        ilike(ServiceProviderCategory.name, `%${filters.search}%`)
      );
    }

    return q;
  }

  protected override applySorting(query: any): any {
    return query.orderBy(sql`name ASC`);
  }
}
