/**
 * PostgreSQL Onboarding Lead Repository Implementation
 */

import { eq, ilike, sql, or } from 'drizzle-orm';
import { OnboardingLead } from '@/db/schema.js';
import type { OnboardingLeadRepository, OnboardingLeadFilters } from './onboarding-lead.repository.interface.js';
import { OnboardingLeadEntity } from '@/domain/index.js';

export class PostgresOnboardingLeadRepository implements OnboardingLeadRepository {
  constructor(
    private db: any,
    _tracer?: unknown | null
  ) {}

  private get tableSchema() {
    return OnboardingLead;
  }

  private mapRowToEntity(row: any): OnboardingLeadEntity {
    return OnboardingLeadEntity.fromPersistence(row);
  }

  private mapEntityToProps(entity: OnboardingLeadEntity): any {
    return entity.toPersistence();
  }

  private buildQuery(filters: OnboardingLeadFilters = {} as OnboardingLeadFilters): any {
    let query = this.db.select().from(this.tableSchema);

    if (filters?.userType) {
      query = query.where(eq(OnboardingLead.userType, filters.userType));
    }

    if (filters?.status) {
      query = query.where(eq(OnboardingLead.status, filters.status));
    }

    if (filters?.categoryId) {
      query = query.where(eq(OnboardingLead.categoryId, filters.categoryId));
    }

    if (filters?.establishmentTypeId) {
      query = query.where(eq(OnboardingLead.establishmentTypeId, filters.establishmentTypeId));
    }

    if (filters?.search) {
      query = query.where(
        or(
          ilike(OnboardingLead.name, `%${filters.search}%`),
          ilike(OnboardingLead.email, `%${filters.search}%`),
          ilike(OnboardingLead.phone, `%${filters.search}%`)
        )
      );
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    return query.orderBy(sql`created_at DESC`);
  }

  async create(entity: OnboardingLeadEntity): Promise<OnboardingLeadEntity> {
    const props = entity.toPersistence();

    // Exclude fields that PostgreSQL generates automatically
    const { id, createdAt, updatedAt, ...rest } = props;

    console.log('[OnboardingLeadRepo.create] insertProps:', rest);

    try {
      const result = await this.db
        .insert(this.tableSchema)
        .values(rest)
        .returning();

      if (result[0]) {
        return OnboardingLeadEntity.fromPersistence(result[0]);
      }

      return entity;
    } catch (error) {
      console.error('[OnboardingLeadRepo.create] Error:', error);
      throw error;
    }
  }

  async findById(id: number): Promise<OnboardingLeadEntity | null> {
    const [row] = await this.db
      .select()
      .from(this.tableSchema)
      .where(eq(OnboardingLead.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    return this.mapRowToEntity(row);
  }

  async findByEmail(email: string): Promise<OnboardingLeadEntity | null> {
    const result = await this.db
      .select()
      .from(this.tableSchema)
      .where(ilike(OnboardingLead.email, email.toLowerCase()))
      .orderBy(sql`created_at DESC`)
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result[0]);
  }

  async findAll(filters?: OnboardingLeadFilters): Promise<OnboardingLeadEntity[]> {
    const query = this.buildQuery(filters);
    const rows = await query;
    return rows.map((row: any) => this.mapRowToEntity(row));
  }

  async count(filters?: OnboardingLeadFilters): Promise<number> {
    let query = this.db.select({ count: sql`count(*)::int` }).from(this.tableSchema);

    if (filters?.userType) {
      query = query.where(eq(OnboardingLead.userType, filters.userType));
    }

    if (filters?.status) {
      query = query.where(eq(OnboardingLead.status, filters.status));
    }

    if (filters?.categoryId) {
      query = query.where(eq(OnboardingLead.categoryId, filters.categoryId));
    }

    if (filters?.establishmentTypeId) {
      query = query.where(eq(OnboardingLead.establishmentTypeId, filters.establishmentTypeId));
    }

    if (filters?.search) {
      query = query.where(
        or(
          ilike(OnboardingLead.name, `%${filters.search}%`),
          ilike(OnboardingLead.email, `%${filters.search}%`),
          ilike(OnboardingLead.phone, `%${filters.search}%`)
        )
      );
    }

    const [result] = await query;
    return (result?.count as number) || 0;
  }

  async update(id: number, entity: Partial<OnboardingLeadEntity>): Promise<OnboardingLeadEntity> {
    const props = this.mapEntityToProps(entity as OnboardingLeadEntity);
    // Don't update id, createdAt, updatedAt
    const { id: _, createdAt, updatedAt, ...updateProps } = props;

    await this.db
      .update(this.tableSchema)
      .set(updateProps)
      .where(eq(OnboardingLead.id, id));

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Entity with id ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: number): Promise<void> {
    await this.db
      .deleteFrom(this.tableSchema)
      .where(eq(OnboardingLead.id, id));
  }
}
