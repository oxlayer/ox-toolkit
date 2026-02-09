/**
 * PostgreSQL Organization Repository
 *
 * Implements organization persistence using PostgreSQL
 */

import type {
  DatabaseAdapter,
  TransactionalDatabaseAdapter,
} from '@oxlayer/foundation-persistence-kit';
import type {
  IOrganizationRepository,
} from './index.js';
import type { Organization } from '../domain/index.js';
import type { QueryOptions } from '@oxlayer/foundation-persistence-kit';

/**
 * PostgreSQL organization repository
 */
export class PostgresOrganizationRepository implements IOrganizationRepository {
  constructor(private readonly db: DatabaseAdapter | TransactionalDatabaseAdapter) {}

  async save(organization: Organization): Promise<void> {
    const props = organization.toPersistence();

    await this.db.query(`
      INSERT INTO organizations (id, name, slug, tier, max_developers, max_projects, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        tier = EXCLUDED.tier,
        max_developers = EXCLUDED.max_developers,
        max_projects = EXCLUDED.max_projects,
        updated_at = EXCLUDED.updated_at
    `, [
      props.id,
      props.name,
      props.slug,
      props.tier,
      props.maxDevelopers,
      props.maxProjects,
      props.createdAt,
      props.updatedAt,
    ]);
  }

  async findById(id: string): Promise<Organization | null> {
    const result = await this.db.queryOne(`
      SELECT id, name, slug, tier, max_developers, max_projects, created_at, updated_at
      FROM organizations
      WHERE id = $1
    `, [id]);

    if (!result) return null;

    return Organization.fromPersistence({
      id: result.id,
      name: result.name,
      slug: result.slug,
      tier: result.tier,
      maxDevelopers: parseInt(result.max_developers),
      maxProjects: parseInt(result.max_projects),
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
    });
  }

  async findAll(options?: QueryOptions): Promise<Organization[]> {
    let query = `
      SELECT id, name, slug, tier, max_developers, max_projects, created_at, updated_at
      FROM organizations
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
      Organization.fromPersistence({
        id: row.id,
        name: row.name,
        slug: row.slug,
        tier: row.tier,
        maxDevelopers: parseInt(row.max_developers),
        maxProjects: parseInt(row.max_projects),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      })
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.query(`DELETE FROM organizations WHERE id = $1`, [id]);
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.db.queryOne(`SELECT 1 FROM organizations WHERE id = $1`, [id]);
    return !!result;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const result = await this.db.queryOne(`
      SELECT id, name, slug, tier, max_developers, max_projects, created_at, updated_at
      FROM organizations
      WHERE slug = $1
    `, [slug]);

    if (!result) return null;

    return Organization.fromPersistence({
      id: result.id,
      name: result.name,
      slug: result.slug,
      tier: result.tier,
      maxDevelopers: parseInt(result.max_developers),
      maxProjects: parseInt(result.max_projects),
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
    });
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const result = await this.db.queryOne(`SELECT 1 FROM organizations WHERE slug = $1`, [slug]);
    return !!result;
  }

  async listByTier(tier: string): Promise<Organization[]> {
    const results = await this.db.query(`
      SELECT id, name, slug, tier, max_developers, max_projects, created_at, updated_at
      FROM organizations
      WHERE tier = $1
      ORDER BY created_at DESC
    `, [tier]);

    return results.map((row: unknown) =>
      Organization.fromPersistence({
        id: row.id,
        name: row.name,
        slug: row.slug,
        tier: row.tier,
        maxDevelopers: parseInt(row.max_developers),
        maxProjects: parseInt(row.max_projects),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      })
    );
  }
}
