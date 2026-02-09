/**
 * PostgreSQL API Key Repository
 *
 * Implements API key persistence using PostgreSQL
 */

import type {
  DatabaseAdapter,
  TransactionalDatabaseAdapter,
} from '@oxlayer/foundation-persistence-kit';
import type {
  IApiKeyRepository,
} from './index.js';
import type { ApiKey } from '../domain/index.js';
import type { QueryOptions } from '@oxlayer/foundation-persistence-kit';

/**
 * PostgreSQL API key repository
 */
export class PostgresApiKeyRepository implements IApiKeyRepository {
  constructor(private readonly db: DatabaseAdapter | TransactionalDatabaseAdapter) {}

  async save(apiKey: ApiKey): Promise<void> {
    const props = apiKey.toPersistence();

    await this.db.query(`
      INSERT INTO api_keys (
        id, organization_id, developer_id, license_id, key_hash, key_prefix,
        name, scopes, environments, status, last_used_at, expires_at, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        scopes = EXCLUDED.scopes,
        environments = EXCLUDED.environments,
        status = EXCLUDED.status,
        last_used_at = EXCLUDED.last_used_at,
        expires_at = EXCLUDED.expires_at,
        updated_at = EXCLUDED.updated_at
    `, [
      props.id,
      props.organizationId,
      props.developerId,
      props.licenseId,
      props.keyHash,
      props.keyPrefix,
      props.name,
      JSON.stringify(props.scopes),
      JSON.stringify(props.environments),
      props.status,
      props.lastUsedAt,
      props.expiresAt,
      props.createdAt,
      props.updatedAt,
    ]);
  }

  async findById(id: string): Promise<ApiKey | null> {
    const result = await this.db.queryOne(`
      SELECT id, organization_id, developer_id, license_id, key_hash, key_prefix,
             name, scopes, environments, status, last_used_at, expires_at, created_at, updated_at
      FROM api_keys
      WHERE id = $1
    `, [id]);

    if (!result) return null;

    return this.mapRowToApiKey(result);
  }

  async findAll(options?: QueryOptions): Promise<ApiKey[]> {
    let query = `
      SELECT id, organization_id, developer_id, license_id, key_hash, key_prefix,
             name, scopes, environments, status, last_used_at, expires_at, created_at, updated_at
      FROM api_keys
    `;

    const params: unknown[] = [];

    if (options?.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }

    if (options?.offset) {
      query += ` OFFSET $${params.length + 1}`;
      params.push(options.offset);
    }

    const results = await this.db.query(query, params);

    return results.map((row: unknown) => this.mapRowToApiKey(row));
  }

  async delete(id: string): Promise<void> {
    await this.db.query(`DELETE FROM api_keys WHERE id = $1`, [id]);
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.db.queryOne(`SELECT 1 FROM api_keys WHERE id = $1`, [id]);
    return !!result;
  }

  async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
    const result = await this.db.queryOne(`
      SELECT id, organization_id, developer_id, license_id, key_hash, key_prefix,
             name, scopes, environments, status, last_used_at, expires_at, created_at, updated_at
      FROM api_keys
      WHERE key_hash = $1
    `, [keyHash]);

    if (!result) return null;

    return this.mapRowToApiKey(result);
  }

  async findByOrganization(organizationId: string): Promise<ApiKey[]> {
    const results = await this.db.query(`
      SELECT id, organization_id, developer_id, license_id, key_hash, key_prefix,
             name, scopes, environments, status, last_used_at, expires_at, created_at, updated_at
      FROM api_keys
      WHERE organization_id = $1
      ORDER BY created_at DESC
    `, [organizationId]);

    return results.map((row: unknown) => this.mapRowToApiKey(row));
  }

  async findByDeveloper(developerId: string): Promise<ApiKey[]> {
    const results = await this.db.query(`
      SELECT id, organization_id, developer_id, license_id, key_hash, key_prefix,
             name, scopes, environments, status, last_used_at, expires_at, created_at, updated_at
      FROM api_keys
      WHERE developer_id = $1
      ORDER BY created_at DESC
    `, [developerId]);

    return results.map((row: unknown) => this.mapRowToApiKey(row));
  }

  async findByLicense(licenseId: string): Promise<ApiKey[]> {
    const results = await this.db.query(`
      SELECT id, organization_id, developer_id, license_id, key_hash, key_prefix,
             name, scopes, environments, status, last_used_at, expires_at, created_at, updated_at
      FROM api_keys
      WHERE license_id = $1
      ORDER BY created_at DESC
    `, [licenseId]);

    return results.map((row: unknown) => this.mapRowToApiKey(row));
  }

  async findActiveByOrganization(organizationId: string): Promise<ApiKey[]> {
    const results = await this.db.query(`
      SELECT id, organization_id, developer_id, license_id, key_hash, key_prefix,
             name, scopes, environments, status, last_used_at, expires_at, created_at, updated_at
      FROM api_keys
      WHERE organization_id = $1
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
    `, [organizationId]);

    return results.map((row: unknown) => this.mapRowToApiKey(row));
  }

  private mapRowToApiKey(row: unknown): ApiKey {
    return ApiKey.fromPersistence({
      id: row.id,
      organizationId: row.organization_id,
      developerId: row.developer_id,
      licenseId: row.license_id,
      keyHash: row.key_hash,
      keyPrefix: row.key_prefix,
      name: row.name,
      scopes: JSON.parse(row.scopes || '[]'),
      environments: JSON.parse(row.environments || '[]'),
      status: row.status,
      lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : null,
      expiresAt: row.expires_at ? new Date(row.expires_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
