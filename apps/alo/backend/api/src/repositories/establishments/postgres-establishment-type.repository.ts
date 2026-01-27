/**
 * PostgreSQL Establishment Type Repository Implementation
 */

import { PostgresRepositoryTemplate } from '@oxlayer/snippets/repositories';
import { EstablishmentType } from '@/db/schema.js';
import { EstablishmentTypeRepository } from './establishment-type.repository.interface.js';
import { EstablishmentTypeEntity } from '@/domain/index.js';

export class PostgresEstablishmentTypeRepository
  extends PostgresRepositoryTemplate<EstablishmentTypeEntity, Record<string, never>, any>
  implements EstablishmentTypeRepository
{
  constructor(db: any, tracer?: unknown | null) {
    super(db, tracer, {
      tableName: 'establishment_types',
      dbSystem: 'postgresql',
      dbName: 'alo_manager',
    });
  }

  protected override get tableSchema() {
    return EstablishmentType;
  }

  protected override mapRowToEntity(row: any): EstablishmentTypeEntity {
    return EstablishmentTypeEntity.fromPersistence(row);
  }

  protected override mapEntityToProps(entity: EstablishmentTypeEntity): any {
    return entity.toPersistence();
  }

  protected override applySorting(query: any): any {
    return query.orderBy(sql`name ASC`);
  }

  async findAll(): Promise<EstablishmentTypeEntity[]> {
    const result = await this.db.select().from(this.tableSchema).orderBy(this.defaultOrderBy);
    return result.rows.map((row: any) => this.mapRowToEntity(row));
  }
}
