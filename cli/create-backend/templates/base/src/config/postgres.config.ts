/**
 * PostgreSQL Configuration
 */

import { createPostgres } from '@oxlayer/capabilities-adapters-postgres';
import postgres from 'postgres';
import { ENV } from './app.config.js';

/**
 * Create PostgreSQL connection with auto-migration and database creation
 */
export async function createPostgresConnection() {
  const POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost';
  const POSTGRES_PORT = Number(process.env.POSTGRES_PORT) || 5432;
  const POSTGRES_DATABASE = process.env.POSTGRES_DATABASE || '{{DB_NAME}}';
  const POSTGRES_USER = process.env.POSTGRES_USER || 'postgres';
  const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'postgres';

  // First, connect to the default 'postgres' database to create the target database if it doesn't exist
  const adminSql = postgres({
    host: POSTGRES_HOST,
    port: POSTGRES_PORT,
    database: 'postgres',
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    max: 1,
  });

  try {
    // Check if database exists
    const existsResult = await adminSql`
      SELECT 1 FROM pg_database WHERE datname = ${POSTGRES_DATABASE}
    `;

    if (existsResult.length === 0) {
      console.log(`[Postgres] Creating database "${POSTGRES_DATABASE}"...`);
      await adminSql.unsafe(`CREATE DATABASE "${POSTGRES_DATABASE}"`);
      console.log(`[Postgres] Database "${POSTGRES_DATABASE}" created`);
    } else {
      console.log(`[Postgres] Database "${POSTGRES_DATABASE}" already exists`);
    }
  } catch (error) {
    console.error('[Postgres] Error checking/creating database:', error);
    throw error;
  } finally {
    await adminSql.end();
  }

  // Now connect to the target database
  return createPostgres({
    host: POSTGRES_HOST,
    port: POSTGRES_PORT,
    database: POSTGRES_DATABASE,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    max: 20,
    idle_timeout: 30,
    connect_timeout: 10,
    migrationSQL: '', // Add migration SQL here or use separate migration files
  });
}
