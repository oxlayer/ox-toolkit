import type { PostgresClient } from './client.js';
import type { Migration, MigrationConfig } from './types.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const DEFAULT_MIGRATIONS_TABLE = '_migrations';
const DEFAULT_MIGRATIONS_SCHEMA = 'public';

/**
 * Migration runner for PostgreSQL
 *
 * @example
 * ```ts
 * import { createMigrationRunner } from '@oxlayer/capabilities-adapters-postgres';
 *
 * const migrations = createMigrationRunner(pg, {
 *   dir: './migrations',
 * });
 *
 * // Create migrations table
 * await migrations.init();
 *
 * // Run pending migrations
 * await migrations.up();
 *
 * // Get migration status
 * const status = await migrations.status();
 * console.log(status);
 * ```
 */
export class MigrationRunner {
  constructor(
    private client: PostgresClient,
    private config: MigrationConfig
  ) { }

  /**
   * Initialize the migrations table
   *
   * Creates the migrations tracking table if it doesn't exist.
   */
  async init(): Promise<void> {
    const tableName = this.escapeIdentifier(this.config.table || DEFAULT_MIGRATIONS_TABLE);
    const schemaName = this.escapeIdentifier(this.config.schema || DEFAULT_MIGRATIONS_SCHEMA);

    await this.client.query(`
      CREATE SCHEMA IF NOT EXISTS ${schemaName};
      CREATE TABLE IF NOT EXISTS ${schemaName}.${tableName} (
        id BIGINT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        hash VARCHAR(64),
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('[MigrationRunner] Migrations table initialized');
  }

  /**
   * Get all available migration files
   *
   * @returns Migration files
   */
  async getMigrationFiles(): Promise<Array<{ id: number; name: string; path: string }>> {
    const files = await fs.readdir(this.config.dir);

    const migrations = files
      .filter((file) => file.endsWith('.sql') && /^[0-9]+_/.test(file))
      .map((file) => {
        const match = file.match(/^([0-9]+)_(.+)\.sql$/);
        if (!match) {
          return null;
        }
        return {
          id: parseInt(match[1], 10),
          name: match[2],
          path: path.join(this.config.dir, file),
        };
      })
      .filter((m): m is { id: number; name: string; path: string } => m !== null)
      .sort((a, b) => a.id - b.id);

    return migrations;
  }

  /**
   * Get all executed migrations
   *
   * @returns Executed migrations
   */
  async getExecutedMigrations(): Promise<Migration[]> {
    const tableName = this.escapeIdentifier(this.config.table || DEFAULT_MIGRATIONS_TABLE);
    const schemaName = this.escapeIdentifier(this.config.schema || DEFAULT_MIGRATIONS_SCHEMA);

    const result = await this.client.query<Migration>(
      `SELECT id, name, hash, executed_at FROM ${schemaName}.${tableName} ORDER BY id ASC`
    );

    return result.rows;
  }

  /**
   * Get migration status
   *
   * @returns Migration status
   */
  async status(): Promise<{
    available: Array<{ id: number; name: string; executed: boolean }>;
    executed: number;
    pending: number;
  }> {
    const [files, executed] = await Promise.all([
      this.getMigrationFiles(),
      this.getExecutedMigrations(),
    ]);

    const executedIds = new Set(executed.map((m) => m.id));

    const available = files.map((file) => ({
      id: file.id,
      name: file.name,
      executed: executedIds.has(file.id),
    }));

    return {
      available,
      executed: executed.length,
      pending: files.length - executed.length,
    };
  }

  /**
   * Calculate file hash
   *
   * @param filePath - File path
   * @returns File hash
   */
  private async calculateHash(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Run a single migration
   *
   * @param file - Migration file
   */
  private async runMigration(file: { id: number; name: string; path: string }): Promise<void> {
    const content = await fs.readFile(file.path, 'utf-8');
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    console.log(`[MigrationRunner] Running migration: ${file.id}_${file.name}`);

    await this.client.query('BEGIN');

    try {
      // Execute migration SQL
      await this.client.query(content);

      // Record migration
      const tableName = this.escapeIdentifier(this.config.table || DEFAULT_MIGRATIONS_TABLE);
      const schemaName = this.escapeIdentifier(this.config.schema || DEFAULT_MIGRATIONS_SCHEMA);

      await this.client.query(
        `INSERT INTO ${schemaName}.${tableName} (id, name, hash) VALUES ($1, $2, $3)`,
        { params: [file.id, file.name, hash] }
      );

      await this.client.query('COMMIT');

      console.log(`[MigrationRunner] Migration completed: ${file.id}_${file.name}`);
    } catch (error) {
      await this.client.query('ROLLBACK');
      console.error(`[MigrationRunner] Migration failed: ${file.id}_${file.name}`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   *
   * @returns Number of migrations run
   */
  async up(): Promise<number> {
    await this.init();

    const [files, executed] = await Promise.all([
      this.getMigrationFiles(),
      this.getExecutedMigrations(),
    ]);

    const executedIds = new Set(executed.map((m) => m.id));
    const pending = files.filter((f) => !executedIds.has(f.id));

    if (pending.length === 0) {
      console.log('[MigrationRunner] No pending migrations');
      return 0;
    }

    console.log(`[MigrationRunner] Running ${pending.length} pending migration(s)`);

    for (const migration of pending) {
      await this.runMigration(migration);
    }

    return pending.length;
  }

  /**
   * Rollback the last migration (not implemented - requires down migration files)
   *
   * @throws Error - Not implemented
   */
  async down(): Promise<void> {
    throw new Error(
      'Rollback is not implemented. Please use down migration files or manual SQL.'
    );
  }

  /**
   * Create a new migration file
   *
   * @param name - Migration name
   * @returns Migration file path
   */
  async create(name: string): Promise<string> {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${name}.sql`;
    const filePath = path.join(this.config.dir, fileName);

    await fs.writeFile(
      filePath,
      `-- Migration: ${name}\n-- Created: ${new Date().toISOString()}\n\n-- Add your UP migration SQL here\n\n`
    );

    console.log(`[MigrationRunner] Created migration file: ${fileName}`);

    return filePath;
  }

  /**
   * Escape an identifier
   */
  private escapeIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`;
  }
}

/**
 * Create a migration runner
 *
 * @param client - PostgresClient instance
 * @param config - Migration configuration
 * @returns MigrationRunner instance
 */
export function createMigrationRunner(
  client: PostgresClient,
  config: MigrationConfig
): MigrationRunner {
  return new MigrationRunner(client, config);
}
