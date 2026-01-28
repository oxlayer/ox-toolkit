/**
 * Tenant Repository
 *
 * Manages tenant data. This is NOT tenant-aware (it's the system-level repository).
 */

import { PostgresRepositoryTemplate } from '@oxlayer/foundation-persistence-kit';
import type { UUID } from '@oxlayer/foundation-domain-kit';
import { TenantTemplate, TenantStatus } from '../domain/tenant.js';

export class TenantRepository extends PostgresRepositoryTemplate<TenantTemplate> {
  constructor(db: any) {
    super(db, 'tenants', TenantTemplate);
  }

  /**
   * Find tenant by domain
   */
  async findByDomain(domain: string): Promise<TenantTemplate | null> {
    const row = await this.db(this.tableName)
      .where('domain', domain)
      .first();
    return row ? this.toEntity(row) : null;
  }

  /**
   * Find active tenants
   */
  async findActive(): Promise<TenantTemplate[]> {
    const rows = await this.db(this.tableName)
      .where('status', TenantStatus.ACTIVE)
      .select('*');
    return rows.map((row: any) => this.toEntity(row));
  }

  /**
   * Convert database row to entity
   */
  protected toEntity(row: any): TenantTemplate {
    return new TenantTemplate({
      tenantId: row.tenant_id,
      name: row.name,
      domain: row.domain,
      status: row.status as TenantStatus,
      maxUsers: row.max_users,
      maxStorageGB: row.max_storage_gb,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  /**
   * Convert entity to database row
   */
  protected toPersistence(entity: TenantTemplate): any {
    return {
      tenant_id: entity.tenantId,
      name: entity.name,
      domain: entity.domain,
      status: entity.status,
      max_users: entity.maxUsers,
      max_storage_gb: entity.maxStorageGB,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }
}
