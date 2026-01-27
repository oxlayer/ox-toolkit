/**
 * PostgreSQL Client with Drizzle ORM
 *
 * A thin wrapper around postgres-js and drizzle-orm.
 * Provides auto-migration capability and a clean interface.
 *
 * @example
 * ```ts
 * import { createPostgres } from '@oxlayer/capabilities-adapters-postgres';
 *
 * const { db, sql } = createPostgres({
 *   database: 'mydb',
 *   password: 'mypass',
 *   autoMigrate: true,
 *   migrationSQL: 'CREATE TABLE IF NOT EXISTS ...',
 * });
 *
 * // Use Drizzle ORM
 * const users = await db.select().from(usersTable);
 *
 * // Or use raw SQL
 * const result = await sql`SELECT * FROM users`;
 * ```
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresConfig, DrizzleDb, PostgresJs } from './types.js';

export interface PostgresConnection {
  /**
   * Drizzle ORM instance for type-safe queries
   */
  db: DrizzleDb;

  /**
   * Raw postgres-js instance for custom queries
   */
  sql: PostgresJs;

  /**
   * Close the connection pool
   */
  close: () => Promise<void>;
}

/**
 * Create a PostgreSQL connection with optional auto-migration
 *
 * @param config - PostgreSQL configuration
 * @returns PostgresConnection with db (Drizzle) and sql (postgres-js)
 */
export function createPostgres(config: PostgresConfig): PostgresConnection {
  const {
    host = 'localhost',
    port = 5432,
    database,
    user = 'postgres',
    password,
    max = 20,
    idle_timeout = 30,
    connect_timeout = 10,
    autoMigrate = true,
    migrationSQL,
  } = config;

  // Create postgres-js instance
  const sql = postgres({
    host,
    port,
    database,
    user,
    password,
    max,
    idle_timeout,
    connect_timeout,
  });

  // Create Drizzle instance
  const db = drizzle(sql);

  /**
   * Run migration if enabled
   */
  async function runMigration() {
    if (!autoMigrate || !migrationSQL) {
      return;
    }

    try {
      console.log('[Postgres] Running auto-migration...');
      await sql.unsafe(migrationSQL);
      console.log('[Postgres] Auto-migration completed');
    } catch (error) {
      console.error('[Postgres] Auto-migration failed:', error);
      throw error;
    }
  }

  // Run migration asynchronously
  if (autoMigrate) {
    runMigration().catch((error) => {
      console.error('[Postgres] Migration error:', error);
      throw error;
    });
  }

  return {
    db,
    sql,
    close: async () => {
      await sql.end();
      console.log('[Postgres] Connection closed');
    },
  };
}

/**
 * Create a PostgreSQL connection from environment variables
 *
 * Environment variables:
 * - POSTGRES_HOST (default: localhost)
 * - POSTGRES_PORT (default: 5432)
 * - POSTGRES_DATABASE
 * - POSTGRES_USER (default: postgres)
 * - POSTGRES_PASSWORD
 *
 * @param config - Optional config overrides
 * @returns PostgresConnection
 */
export function createPostgresFromEnv(config?: Partial<PostgresConfig>): PostgresConnection {
  return createPostgres({
    host: config?.host || process.env.POSTGRES_HOST,
    port: config?.port || Number(process.env.POSTGRES_PORT) || 5432,
    database: config?.database || process.env.POSTGRES_DATABASE!,
    user: config?.user || process.env.POSTGRES_USER || 'postgres',
    password: config?.password || process.env.POSTGRES_PASSWORD!,
    max: config?.max,
    idle_timeout: config?.idle_timeout,
    connect_timeout: config?.connect_timeout,
    autoMigrate: config?.autoMigrate,
    migrationSQL: config?.migrationSQL,
  });
}
