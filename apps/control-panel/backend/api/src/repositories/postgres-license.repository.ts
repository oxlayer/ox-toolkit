/**
 * PostgreSQL License Repository
 *
 * Implements license persistence using PostgreSQL
 */

import type {
  DatabaseAdapter,
  TransactionalDatabaseAdapter,
} from '@oxlayer/foundation-persistence-kit';
import type {
  ILicenseRepository,
} from './index.js';
import type { License } from '../domain/index.js';
import type { QueryOptions } from '@oxlayer/foundation-persistence-kit';

/**
 * PostgreSQL license repository
 */
export class PostgresLicenseRepository implements ILicenseRepository {
  constructor(private readonly db: DatabaseAdapter | TransactionalDatabaseAdapter) {}

  async save(license: License): Promise<void> {
    const props = license.toPersistence();

    await this.db.query(`
      INSERT INTO licenses (
        id, organization_id, name, tier, status, packages, capabilities,
        environments, expires_at, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        tier = EXCLUDED.tier,
        status = EXCLUDED.status,
        packages = EXCLUDED.packages,
        capabilities = EXCLUDED.capabilities,
        environments = EXCLUDED.environments,
        expires_at = EXCLUDED.expires_at,
        updated_at = EXCLUDED.updated_at
    `, [
      props.id,
      props.organizationId,
      props.name,
      props.tier,
      props.status,
      JSON.stringify(props.packages),
      JSON.stringify(props.capabilities),
      JSON.stringify(props.environments),
      props.expiresAt,
      props.createdAt,
      props.updatedAt,
    ]);
  }

  async findById(id: string): Promise<License | null> {
    const result = await this.db.queryOne(`
      SELECT id, organization_id, name, tier, status, packages, capabilities,
             environments, expires_at, created_at, updated_at
      FROM licenses
      WHERE id = $1
    `, [id]);

    if (!result) return null;

    return License.fromPersistence({
      id: result.id,
      organizationId: result.organization_id,
      name: result.name,
      tier: result.tier,
      status: result.status,
      packages: JSON.parse(result.packages || '[]'),
      capabilities: JSON.parse(result.capabilities || '{}'),
      environments: JSON.parse(result.environments || '[]'),
      expiresAt: result.expires_at ? new Date(result.expires_at) : null,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
    });
  }

  async findAll(options?: QueryOptions): Promise<License[]> {
    let query = `
      SELECT id, organization_id, name, tier, status, packages, capabilities,
             environments, expires_at, created_at, updated_at
      FROM licenses
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

    return results.map((row: unknown) => this.mapRowToLicense(row));
  }

  async delete(id: string): Promise<void> {
    await this.db.query(`DELETE FROM licenses WHERE id = $1`, [id]);
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.db.queryOne(`SELECT 1 FROM licenses WHERE id = $1`, [id]);
    return !!result;
  }

  async findByOrganization(organizationId: string): Promise<License[]> {
    const results = await this.db.query(`
      SELECT id, organization_id, name, tier, status, packages, capabilities,
             environments, expires_at, created_at, updated_at
      FROM licenses
      WHERE organization_id = $1
      ORDER BY created_at DESC
    `, [organizationId]);

    return results.map((row: unknown) => this.mapRowToLicense(row));
  }

  async findActiveByOrganization(organizationId: string): Promise<License[]> {
    const results = await this.db.query(`
      SELECT id, organization_id, name, tier, status, packages, capabilities,
             environments, expires_at, created_at, updated_at
      FROM licenses
      WHERE organization_id = $1
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
    `, [organizationId]);

    return results.map((row: unknown) => this.mapRowToLicense(row));
  }

  async findByApiKey(apiKeyId: string): Promise<License | null> {
    const result = await this.db.queryOne(`
      SELECT l.id, l.organization_id, l.name, l.tier, l.status, l.packages, l.capabilities,
             l.environments, l.expires_at, l.created_at, l.updated_at
      FROM licenses l
      INNER JOIN api_keys ak ON ak.license_id = l.id
      WHERE ak.id = $1
    `, [apiKeyId]);

    if (!result) return null;

    return License.fromPersistence({
      id: result.id,
      organizationId: result.organization_id,
      name: result.name,
      tier: result.tier,
      status: result.status,
      packages: JSON.parse(result.packages || '[]'),
      capabilities: JSON.parse(result.capabilities || '{}'),
      environments: JSON.parse(result.environments || '[]'),
      expiresAt: result.expires_at ? new Date(result.expires_at) : null,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
    });
  }

  async findValidForOrganizationAndCapability(
    organizationId: string,
    capabilityName: string
  ): Promise<License | null> {
    const result = await this.db.queryOne(`
      SELECT id, organization_id, name, tier, status, packages, capabilities,
             environments, expires_at, created_at, updated_at
      FROM licenses
      WHERE organization_id = $1
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
        AND capabilities ? $2
      ORDER BY created_at DESC
      LIMIT 1
    `, [organizationId, capabilityName]);

    if (!result) return null;

    return License.fromPersistence({
      id: result.id,
      organizationId: result.organization_id,
      name: result.name,
      tier: result.tier,
      status: result.status,
      packages: JSON.parse(result.packages || '[]'),
      capabilities: JSON.parse(result.capabilities || '{}'),
      environments: JSON.parse(result.environments || '[]'),
      expiresAt: result.expires_at ? new Date(result.expires_at) : null,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
    });
  }

  private mapRowToLicense(row: unknown): License {
    return License.fromPersistence({
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      tier: row.tier,
      status: row.status,
      packages: JSON.parse(row.packages || '[]'),
      capabilities: JSON.parse(row.capabilities || '{}'),
      environments: JSON.parse(row.environments || '[]'),
      expiresAt: row.expires_at ? new Date(row.expires_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
