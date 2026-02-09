/**
 * PostgreSQL Developer Repository
 *
 * Implements developer persistence using PostgreSQL with Drizzle ORM
 */

import { eq, desc, sql, count } from 'drizzle-orm';
import type { IDeveloperRepository } from './index.js';
import { Developer } from '../domain/index.js';
import type { QueryOptions } from '@oxlayer/foundation-persistence-kit';
import { developers } from '../db/schema.js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../db/schema.js';

/**
 * PostgreSQL developer repository
 */
export class PostgresDeveloperRepository implements IDeveloperRepository {
  constructor(
    private readonly db: PostgresJsDatabase<typeof schema>
  ) {}

  async save(developer: Developer): Promise<void> {
    const props = developer.toPersistence();
    const data = {
      id: props.id,
      organizationId: props.organizationId,
      name: props.name,
      email: props.email,
      environments: props.environments,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };

    await this.db
      .insert(developers)
      .values(data)
      .onConflictDoUpdate({
        target: developers.id,
        set: {
          name: data.name,
          email: data.email,
          environments: data.environments,
          updatedAt: data.updatedAt,
        },
      });
  }

  async findById(id: string): Promise<Developer | null> {
    const result = await this.db
      .select()
      .from(developers)
      .where(eq(developers.id, id))
      .limit(1);

    if (!result[0]) return null;

    return this.mapToDomain(result[0]);
  }

  async findAll(options?: QueryOptions): Promise<Developer[]> {
    let query = this.db.select().from(developers).$dynamic();

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
    await this.db.delete(developers).where(eq(developers.id, id));
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.db
      .select({ id: developers.id })
      .from(developers)
      .where(eq(developers.id, id))
      .limit(1);
    return !!result[0];
  }

  async findByEmail(email: string): Promise<Developer | null> {
    const result = await this.db
      .select()
      .from(developers)
      .where(eq(developers.email, email.toLowerCase()))
      .limit(1);

    if (!result[0]) return null;

    return this.mapToDomain(result[0]);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const result = await this.db
      .select({ id: developers.id })
      .from(developers)
      .where(eq(developers.email, email.toLowerCase()))
      .limit(1);
    return !!result[0];
  }

  async findByOrganization(organizationId: string): Promise<Developer[]> {
    const results = await this.db
      .select()
      .from(developers)
      .where(eq(developers.organizationId, organizationId))
      .orderBy(desc(developers.createdAt));

    return results.map((row: any) => this.mapToDomain(row));
  }

  async countByOrganization(organizationId: string): Promise<number> {
    const result = await this.db
      .select({ count: count() })
      .from(developers)
      .where(eq(developers.organizationId, organizationId));

    return result[0]?.count ?? 0;
  }

  private mapToDomain(row: any): Developer {
    return Developer.fromPersistence({
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      email: row.email,
      environments: row.environments,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
