/**
 * PostgreSQL License Repository
 *
 * Implements license persistence using PostgreSQL with Drizzle ORM
 */

import { eq, desc, and, or, gt, isNull, sql } from 'drizzle-orm';
import type { ILicenseRepository } from './index.js';
import { License } from '../domain/index.js';
import type { QueryOptions } from '@oxlayer/foundation-persistence-kit';
import { licenses, apiKeys } from '../db/schema.js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../db/schema.js';

/**
 * PostgreSQL license repository
 */
export class PostgresLicenseRepository implements ILicenseRepository {
  constructor(
    private readonly db: PostgresJsDatabase<typeof schema>
  ) {}

  async save(license: License): Promise<void> {
    const props = license.toPersistence();
    const data = {
      id: props.id,
      organizationId: props.organizationId,
      name: props.name,
      tier: props.tier,
      status: props.status,
      packages: props.packages,
      capabilities: props.capabilities,
      environments: props.environments,
      expiresAt: props.expiresAt,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };

    await this.db
      .insert(licenses)
      .values(data)
      .onConflictDoUpdate({
        target: licenses.id,
        set: {
          name: data.name,
          tier: data.tier,
          status: data.status,
          packages: data.packages,
          capabilities: data.capabilities,
          environments: data.environments,
          expiresAt: data.expiresAt,
          updatedAt: data.updatedAt,
        },
      });
  }

  async findById(id: string): Promise<License | null> {
    const result = await this.db
      .select()
      .from(licenses)
      .where(eq(licenses.id, id))
      .limit(1);

    if (!result[0]) return null;

    return this.mapToDomain(result[0]);
  }

  async findAll(options?: QueryOptions): Promise<License[]> {
    let query = this.db.select().from(licenses).$dynamic();

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
    await this.db.delete(licenses).where(eq(licenses.id, id));
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.db
      .select({ id: licenses.id })
      .from(licenses)
      .where(eq(licenses.id, id))
      .limit(1);
    return !!result[0];
  }

  async findByOrganization(organizationId: string): Promise<License[]> {
    const results = await this.db
      .select()
      .from(licenses)
      .where(eq(licenses.organizationId, organizationId))
      .orderBy(desc(licenses.createdAt));

    return results.map((row: any) => this.mapToDomain(row));
  }

  async findActiveByOrganization(organizationId: string): Promise<License[]> {
    const now = new Date();
    const results = await this.db
      .select()
      .from(licenses)
      .where(
        and(
          eq(licenses.organizationId, organizationId),
          eq(licenses.status, 'active'),
          or(
            isNull(licenses.expiresAt),
            gt(licenses.expiresAt, now)
          )
        )
      )
      .orderBy(desc(licenses.createdAt));

    return results.map((row: any) => this.mapToDomain(row));
  }

  async findByApiKey(apiKeyId: string): Promise<License | null> {
    const result = await this.db
      .select({
        id: licenses.id,
        organizationId: licenses.organizationId,
        name: licenses.name,
        tier: licenses.tier,
        status: licenses.status,
        packages: licenses.packages,
        capabilities: licenses.capabilities,
        environments: licenses.environments,
        expiresAt: licenses.expiresAt,
        createdAt: licenses.createdAt,
        updatedAt: licenses.updatedAt,
      })
      .from(licenses)
      .innerJoin(apiKeys, eq(apiKeys.licenseId, licenses.id))
      .where(eq(apiKeys.id, apiKeyId))
      .limit(1);

    if (!result[0]) return null;

    return this.mapToDomain(result[0]);
  }

  async findValidForOrganizationAndCapability(
    organizationId: string,
    capabilityName: string
  ): Promise<License | null> {
    const now = new Date();
    const results = await this.db
      .select()
      .from(licenses)
      .where(
        and(
          eq(licenses.organizationId, organizationId),
          eq(licenses.status, 'active'),
          or(
            isNull(licenses.expiresAt),
            gt(licenses.expiresAt, now)
          ),
          sql`${licenses.capabilities} ? ${capabilityName}`
        )
      )
      .orderBy(desc(licenses.createdAt))
      .limit(1);

    if (!results[0]) return null;
    return this.mapToDomain(results[0]);
  }

  private mapToDomain(row: any): License {
    return License.fromPersistence({
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      tier: row.tier,
      status: row.status,
      packages: row.packages,
      capabilities: row.capabilities,
      environments: row.environments,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
