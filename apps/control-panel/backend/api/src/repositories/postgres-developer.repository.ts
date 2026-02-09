/**
 * PostgreSQL Developer Repository
 *
 * Implements developer persistence using PostgreSQL
 */

import type {
  DatabaseAdapter,
  TransactionalDatabaseAdapter,
} from '@oxlayer/foundation-persistence-kit';
import type {
  IDeveloperRepository,
} from './index.js';
import type { Developer } from '../domain/index.js';
import type { QueryOptions } from '@oxlayer/foundation-persistence-kit';

/**
 * PostgreSQL developer repository
 */
export class PostgresDeveloperRepository implements IDeveloperRepository {
  constructor(private readonly db: DatabaseAdapter | TransactionalDatabaseAdapter) {}

  async save(developer: Developer): Promise<void> {
    const props = developer.toPersistence();

    await this.db.query(`
      INSERT INTO developers (id, organization_id, name, email, environments, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        environments = EXCLUDED.environments,
        updated_at = EXCLUDED.updated_at
    `, [
      props.id,
      props.organizationId,
      props.name,
      props.email,
      JSON.stringify(props.environments),
      props.createdAt,
      props.updatedAt,
    ]);
  }

  async findById(id: string): Promise<Developer | null> {
    const result = await this.db.queryOne(`
      SELECT id, organization_id, name, email, environments, created_at, updated_at
      FROM developers
      WHERE id = $1
    `, [id]);

    if (!result) return null;

    return Developer.fromPersistence({
      id: result.id,
      organizationId: result.organization_id,
      name: result.name,
      email: result.email,
      environments: JSON.parse(result.environments || '[]'),
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
    });
  }

  async findAll(options?: QueryOptions): Promise<Developer[]> {
    let query = `
      SELECT id, organization_id, name, email, environments, created_at, updated_at
      FROM developers
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

    return results.map((row: unknown) =>
      Developer.fromPersistence({
        id: row.id,
        organizationId: row.organization_id,
        name: row.name,
        email: row.email,
        environments: JSON.parse(row.environments || '[]'),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      })
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.query(`DELETE FROM developers WHERE id = $1`, [id]);
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.db.queryOne(`SELECT 1 FROM developers WHERE id = $1`, [id]);
    return !!result;
  }

  async findByEmail(email: string): Promise<Developer | null> {
    const result = await this.db.queryOne(`
      SELECT id, organization_id, name, email, environments, created_at, updated_at
      FROM developers
      WHERE email = $1
    `, [email.toLowerCase()]);

    if (!result) return null;

    return Developer.fromPersistence({
      id: result.id,
      organizationId: result.organization_id,
      name: result.name,
      email: result.email,
      environments: JSON.parse(result.environments || '[]'),
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const result = await this.db.queryOne(
      `SELECT 1 FROM developers WHERE email = $1`,
      [email.toLowerCase()]
    );
    return !!result;
  }

  async findByOrganization(organizationId: string): Promise<Developer[]> {
    const results = await this.db.query(`
      SELECT id, organization_id, name, email, environments, created_at, updated_at
      FROM developers
      WHERE organization_id = $1
      ORDER BY created_at DESC
    `, [organizationId]);

    return results.map((row: unknown) =>
      Developer.fromPersistence({
        id: row.id,
        organizationId: row.organization_id,
        name: row.name,
        email: row.email,
        environments: JSON.parse(row.environments || '[]'),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      })
    );
  }

  async countByOrganization(organizationId: string): Promise<number> {
    const result = await this.db.queryOne(
      `SELECT COUNT(*) as count FROM developers WHERE organization_id = $1`,
      [organizationId]
    );
    return parseInt(result?.count ?? '0');
  }
}
