/**
 * PostgreSQL API Key Repository
 *
 * Implements API key persistence using PostgreSQL with Drizzle ORM
 */

import { eq, desc, and, gt, isNull, sql } from 'drizzle-orm';
import type { IApiKeyRepository } from './index.js';
import { ApiKey } from '../domain/index.js';
import type { QueryOptions } from '@oxlayer/foundation-persistence-kit';
import { apiKeys } from '../db/schema.js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../db/schema.js';

/**
 * PostgreSQL API key repository
 */
export class PostgresApiKeyRepository implements IApiKeyRepository {
  constructor(
    private readonly db: PostgresJsDatabase<typeof schema>
  ) {}

  async save(apiKey: ApiKey): Promise<void> {
    const props = apiKey.toPersistence();
    const data = {
      id: props.id,
      organizationId: props.organizationId,
      developerId: props.developerId,
      licenseId: props.licenseId,
      keyHash: props.keyHash,
      keyPrefix: props.keyPrefix,
      name: props.name,
      scopes: props.scopes,
      environments: props.environments,
      status: props.status,
      lastUsedAt: props.lastUsedAt,
      expiresAt: props.expiresAt,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };

    await this.db
      .insert(apiKeys)
      .values(data)
      .onConflictDoUpdate({
        target: apiKeys.id,
        set: {
          name: data.name,
          scopes: data.scopes,
          environments: data.environments,
          status: data.status,
          lastUsedAt: data.lastUsedAt,
          expiresAt: data.expiresAt,
          updatedAt: data.updatedAt,
        },
      });
  }

  async findById(id: string): Promise<ApiKey | null> {
    const result = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, id))
      .limit(1);

    if (!result[0]) return null;

    return this.mapToDomain(result[0]);
  }

  async findAll(options?: QueryOptions): Promise<ApiKey[]> {
    let query = this.db.select().from(apiKeys).$dynamic();

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
    await this.db.delete(apiKeys).where(eq(apiKeys.id, id));
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(eq(apiKeys.id, id))
      .limit(1);
    return !!result[0];
  }

  async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
    const result = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1);

    if (!result[0]) return null;

    return this.mapToDomain(result[0]);
  }

  async findByOrganization(organizationId: string): Promise<ApiKey[]> {
    const results = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.organizationId, organizationId))
      .orderBy(desc(apiKeys.createdAt));

    return results.map((row: any) => this.mapToDomain(row));
  }

  async findByDeveloper(developerId: string): Promise<ApiKey[]> {
    const results = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.developerId, developerId))
      .orderBy(desc(apiKeys.createdAt));

    return results.map((row: any) => this.mapToDomain(row));
  }

  async findByLicense(licenseId: string): Promise<ApiKey[]> {
    const results = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.licenseId, licenseId))
      .orderBy(desc(apiKeys.createdAt));

    return results.map((row: any) => this.mapToDomain(row));
  }

  async findActiveByOrganization(organizationId: string): Promise<ApiKey[]> {
    const now = new Date();
    const results = await this.db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.organizationId, organizationId),
          eq(apiKeys.status, 'active'),
          sql`${apiKeys.expiresAt} IS NULL OR ${apiKeys.expiresAt} > ${now}`
        )
      )
      .orderBy(desc(apiKeys.createdAt));

    return results.map((row: any) => this.mapToDomain(row));
  }

  private mapToDomain(row: any): ApiKey {
    return ApiKey.fromPersistence({
      id: row.id,
      organizationId: row.organizationId,
      developerId: row.developerId,
      licenseId: row.licenseId,
      keyHash: row.keyHash,
      keyPrefix: row.keyPrefix,
      name: row.name,
      scopes: row.scopes,
      environments: row.environments,
      status: row.status,
      lastUsedAt: row.lastUsedAt,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
