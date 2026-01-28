/**
 * Tenant-Aware Item Repository
 *
 * Data access layer for Item entity with automatic tenant isolation.
 * All queries are automatically scoped to the current tenant.
 */

import { PostgresRepositoryTemplate } from '@oxlayer/foundation-persistence-kit';
import type { UUID } from '@oxlayer/foundation-domain-kit';
import { ItemTemplate } from '../domain/item.js';
import { requireTenantId } from '../middleware/tenant.context.js';

/**
 * Tenant-Aware Repository Base
 * Extends PostgresRepositoryTemplate with automatic tenant filtering
 */
export abstract class TenantAwareRepositoryTemplate<T, ID = UUID> extends PostgresRepositoryTemplate<T, ID> {
  constructor(db: any, tableName: string, entityClass: new (...args: any[]) => T) {
    super(db, tableName, entityClass);
  }

  /**
   * Get tenant ID from context
   */
  protected getTenantId(): UUID {
    return requireTenantId();
  }

  /**
   * Add tenant filter to WHERE clause
   */
  protected async withTenantFilter(query: any): Promise<any> {
    const tenantId = this.getTenantId();
    return query.where('tenant_id', tenantId);
  }

  /**
   * Find by ID with tenant isolation
   */
  async findById(id: ID): Promise<T | null> {
    const query = this.db(this.tableName).where('id', id);
    const filtered = await this.withTenantFilter(query);
    const row = await filtered.first();
    return row ? this.toEntity(row) : null;
  }

  /**
   * Find all with tenant isolation
   */
  async findAll(): Promise<T[]> {
    const query = this.db(this.tableName);
    const filtered = await this.withTenantFilter(query);
    const rows = await filtered.select('*');
    return rows.map((row: any) => this.toEntity(row));
  }

  /**
   * Create with tenant ID
   */
  async create(entity: T): Promise<T> {
    const data = this.toPersistence(entity);
    const tenantId = this.getTenantId();
    const [row] = await this.db(this.tableName)
      .insert({ ...data, tenant_id: tenantId })
      .returning('*');
    return this.toEntity(row);
  }

  /**
   * Update with tenant verification
   */
  async update(id: ID, entity: T): Promise<T | null> {
    const data = this.toPersistence(entity);
    const query = this.db(this.tableName).where('id', id);
    const filtered = await this.withTenantFilter(query);
    const [row] = await filtered
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return row ? this.toEntity(row) : null;
  }

  /**
   * Delete with tenant verification
   */
  async delete(id: ID): Promise<boolean> {
    const query = this.db(this.tableName).where('id', id);
    const filtered = await this.withTenantFilter(query);
    const count = await filtered.del();
    return count > 0;
  }
}

/**
 * Item Repository - Tenant Aware
 */
export class ItemRepository extends TenantAwareRepositoryTemplate<ItemTemplate> {
  constructor(db: any) {
    super(db, 'items', ItemTemplate);
  }

  /**
   * Custom query: Find items by name with tenant isolation
   */
  async findByName(name: string): Promise<ItemTemplate[]> {
    const tenantId = this.getTenantId();
    const rows = await this.db(this.tableName)
      .where('tenant_id', tenantId)
      .where('name', 'ilike', `%${name}%`)
      .select('*');
    return rows.map((row: any) => this.toEntity(row));
  }

  /**
   * Custom query: Count items for current tenant
   */
  async countByTenant(): Promise<number> {
    const tenantId = this.getTenantId();
    const result = await this.db(this.tableName)
      .where('tenant_id', tenantId)
      .count('* as count')
      .first();
    return Number(result?.count || 0);
  }

  /**
   * Convert database row to entity
   */
  protected toEntity(row: any): ItemTemplate {
    return new ItemTemplate({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      description: row.description || '',
      quantity: row.quantity,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  /**
   * Convert entity to database row
   */
  protected toPersistence(entity: ItemTemplate): any {
    return {
      id: entity.id,
      tenant_id: entity.tenantId,
      name: entity.name,
      description: entity.description,
      quantity: entity.quantity,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }
}
