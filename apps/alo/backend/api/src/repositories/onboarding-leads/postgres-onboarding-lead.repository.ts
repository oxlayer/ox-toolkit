/**
 * PostgreSQL Onboarding Lead Repository Implementation
 */

import { eq, ilike, sql, and, or } from 'drizzle-orm';
import { PostgresRepositoryTemplate } from '@oxlayer/snippets/repositories';
import { OnboardingLead } from '@/db/schema.js';
import { OnboardingLeadRepository, OnboardingLeadFilters } from './onboarding-lead.repository.interface.js';
import { OnboardingLeadEntity } from '@/domain/index.js';

export class PostgresOnboardingLeadRepository
  extends PostgresRepositoryTemplate<OnboardingLeadEntity, OnboardingLeadFilters, any>
  implements OnboardingLeadRepository
{
  constructor(db: any, tracer?: unknown | null) {
    super(db, tracer, {
      tableName: 'onboarding_leads',
      dbSystem: 'postgresql',
      dbName: 'alo_manager',
    });
  }

  protected override get tableSchema() {
    return OnboardingLead;
  }

  protected override mapRowToEntity(row: any): OnboardingLeadEntity {
    return OnboardingLeadEntity.fromPersistence(row);
  }

  protected override mapEntityToProps(entity: OnboardingLeadEntity): any {
    return entity.toPersistence();
  }

  protected override applyFilters(query: any, filters: OnboardingLeadFilters): any {
    let q = super.applyFilters(query, filters);

    if (filters?.userType) {
      q = q.where(eq(OnboardingLead.userType, filters.userType));
    }

    if (filters?.status) {
      q = q.where(eq(OnboardingLead.status, filters.status));
    }

    if (filters?.categoryId) {
      q = q.where(eq(OnboardingLead.categoryId, filters.categoryId));
    }

    if (filters?.establishmentTypeId) {
      q = q.where(eq(OnboardingLead.establishmentTypeId, filters.establishmentTypeId));
    }

    if (filters?.search) {
      q = q.where(
        or(
          ilike(OnboardingLead.name, `%${filters.search}%`),
          ilike(OnboardingLead.email, `%${filters.search}%`),
          ilike(OnboardingLead.phone, `%${filters.search}%`)
        )
      );
    }

    return q;
  }

  protected override applySorting(query: any): any {
    return query.orderBy(sql`created_at DESC`);
  }

  async findByEmail(email: string): Promise<OnboardingLeadEntity | null> {
    const result = await this.db
      .select()
      .from(this.tableSchema)
      .where(ilike(OnboardingLead.email, email.toLowerCase()))
      .orderBy(sql`created_at DESC`)
      .limit(1);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }
}
