/**
 * PostgreSQL Delivery Man Repository Implementation
 */

import { eq, ilike, sql, and, or } from 'drizzle-orm';
import { PostgresRepositoryTemplate } from '@oxlayer/snippets/repositories';
import { DeliveryMan } from '@/db/schema.js';
import { DeliveryManRepository, DeliveryManFilters } from './delivery-man.repository.interface.js';
import { DeliveryManEntity } from '@/domain/index.js';

export class PostgresDeliveryManRepository
  extends PostgresRepositoryTemplate<DeliveryManEntity, DeliveryManFilters, any>
  implements DeliveryManRepository
{
  constructor(db: any, tracer?: unknown | null) {
    super(db, tracer, {
      tableName: 'delivery_men',
      dbSystem: 'postgresql',
      dbName: 'alo_manager',
    });
  }

  protected override get tableSchema() {
    return DeliveryMan;
  }

  protected override mapRowToEntity(row: any): DeliveryManEntity {
    return DeliveryManEntity.fromPersistence(row);
  }

  protected override mapEntityToProps(entity: DeliveryManEntity): any {
    return entity.toPersistence();
  }

  protected override applyFilters(query: any, filters: DeliveryManFilters): any {
    let q = super.applyFilters(query, filters);

    if (filters?.establishmentId) {
      q = q.where(eq(DeliveryMan.establishmentId, filters.establishmentId));
    }

    if (filters?.isActive !== undefined) {
      q = q.where(eq(DeliveryMan.isActive, filters.isActive));
    }

    if (filters?.search) {
      q = q.where(
        or(
          ilike(DeliveryMan.name, `%${filters.search}%`),
          ilike(DeliveryMan.email, `%${filters.search}%`),
          ilike(DeliveryMan.phone, `%${filters.search}%`)
        )
      );
    }

    return q;
  }

  protected override applySorting(query: any): any {
    return query.orderBy(sql`name ASC`);
  }

  async findByEmail(email: string): Promise<DeliveryManEntity | null> {
    const result = await this.db
      .select()
      .from(this.tableSchema)
      .where(eq(DeliveryMan.email, email.toLowerCase()))
      .limit(1);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }
}
