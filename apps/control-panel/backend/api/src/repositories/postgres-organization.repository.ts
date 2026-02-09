/**
 * PostgreSQL Organization Repository
 *
 * Implements organization persistence using PostgreSQL with Drizzle ORM
 */

import { eq, desc } from 'drizzle-orm';
import type { IOrganizationRepository } from './index.js';
import { Organization } from '../domain/index.js';
import type { QueryOptions } from '@oxlayer/foundation-persistence-kit';
import { organizations } from '../db/schema.js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../db/schema.js';

/**
 * PostgreSQL organization repository
 */
export class PostgresOrganizationRepository implements IOrganizationRepository {
  constructor(
    private readonly db: PostgresJsDatabase<typeof schema>
  ) {}

  async save(organization: Organization): Promise<void> {
    const props = organization.toPersistence();
    const data = {
      id: props.id,
      name: props.name,
      slug: props.slug,
      tier: props.tier,
      maxDevelopers: props.maxDevelopers,
      maxProjects: props.maxProjects,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };

    await this.db
      .insert(organizations)
      .values(data)
      .onConflictDoUpdate({
        target: organizations.id,
        set: {
          name: data.name,
          slug: data.slug,
          tier: data.tier,
          maxDevelopers: data.maxDevelopers,
          maxProjects: data.maxProjects,
          updatedAt: data.updatedAt,
        },
      });
  }

  async findById(id: string): Promise<Organization | null> {
    const result = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    if (!result[0]) return null;

    return this.mapToDomain(result[0]);
  }

  async findAll(options?: QueryOptions): Promise<Organization[]> {
    let query = this.db.select().from(organizations).$dynamic();

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    const results = await query;
    return results.map((row: any) => this.mapToDomain(row));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(organizations).where(eq(organizations.id, id));
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);
    return !!result[0];
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const result = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);

    if (!result[0]) return null;

    return this.mapToDomain(result[0]);
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const result = await this.db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);
    return !!result[0];
  }

  async listByTier(tier: string): Promise<Organization[]> {
    const results = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.tier, tier))
      .orderBy(desc(organizations.createdAt));

    return results.map((row: any) => this.mapToDomain(row));
  }

  private mapToDomain(row: any): Organization {
    return Organization.fromPersistence({
      id: row.id,
      name: row.name,
      slug: row.slug,
      tier: row.tier,
      maxDevelopers: row.maxDevelopers,
      maxProjects: row.maxProjects,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
