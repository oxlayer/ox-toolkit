/**
 * PostgreSQL Establishment Repository Implementation
 */

import { eq, ilike, sql, and } from 'drizzle-orm';
import { PostgresRepositoryTemplate } from '@oxlayer/snippets/repositories';
import { Establishment } from '@/db/schema.js';
import {
  EstablishmentRepository,
  EstablishmentFilters,
} from './establishment.repository.interface.js';
import { EstablishmentEntity } from '@/domain/index.js';

export class PostgresEstablishmentRepository
  extends PostgresRepositoryTemplate<EstablishmentEntity, EstablishmentFilters, any>
  implements EstablishmentRepository
{
  constructor(db: any, tracer?: unknown | null) {
    super(db, tracer, {
      tableName: 'establishments',
      dbSystem: 'postgresql',
      dbName: 'alo_manager',
    });
  }

  protected override get tableSchema() {
    return Establishment;
  }

  protected override mapRowToEntity(row: any): EstablishmentEntity {
    return EstablishmentEntity.fromPersistence(row);
  }

  protected override mapEntityToProps(entity: EstablishmentEntity): any {
    return entity.toPersistence();
  }

  protected override applyFilters(query: any, filters: EstablishmentFilters): any {
    let q = super.applyFilters(query, filters);

    if (filters?.ownerId) {
      q = q.where(eq(Establishment.ownerId, filters.ownerId));
    }

    if (filters?.establishmentTypeId) {
      q = q.where(eq(Establishment.establishmentTypeId, filters.establishmentTypeId));
    }

    if (filters?.search) {
      q = q.where(
        or(
          ilike(Establishment.name, `%${filters.search}%`),
          ilike(Establishment.description, `%${filters.search}%`)
        )
      );
    }

    return q;
  }

  protected override applySorting(query: any): any {
    return query.orderBy(sql`created_at DESC`);
  }
}
