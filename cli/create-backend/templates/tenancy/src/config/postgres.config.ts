/**
 * PostgreSQL Configuration - Multi-Tenant
 *
 * Supports both shared database (single DB with tenant_id columns)
 * and per-tenant database isolation strategies.
 */

import { createPostgres } from '@oxlayer/capabilities-adapters-postgres';
import postgres from 'postgres';
import { ENV } from './app.config.js';

type UUID = string;

/**
 * Database configuration
 */
interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

/**
 * Get base PostgreSQL configuration
 */
function getPostgresConfig(): PostgresConfig {
  return {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT) || 5432,
    database: process.env.POSTGRES_DATABASE || '{{DB_NAME}}',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
  };
}

/**
 * Create PostgreSQL connection with auto-migration and database creation
 */
export async function createPostgresConnection() {
  const config = getPostgresConfig();

  // First, connect to the default 'postgres' database to create the target database if it doesn't exist
  const adminSql = postgres({
    host: config.host,
    port: config.port,
    database: 'postgres',
    user: config.user,
    password: config.password,
    max: 1,
  });

  try {
    // Check if database exists
    const existsResult = await adminSql`
      SELECT 1 FROM pg_database WHERE datname = ${config.database}
    `;

    if (existsResult.length === 0) {
      console.log(`[Postgres] Creating database "${config.database}"...`);
      await adminSql.unsafe(`CREATE DATABASE "${config.database}"`);
      console.log(`[Postgres] Database "${config.database}" created`);
    } else {
      console.log(`[Postgres] Database "${config.database}" already exists`);
    }
  } catch (error) {
    console.error('[Postgres] Error checking/creating database:', error);
    throw error;
  } finally {
    await adminSql.end();
  }

  // Now connect to the target database
  return createPostgres({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    max: 20,
    idle_timeout: 30,
    connect_timeout: 10,
    migrationSQL: '', // Add migration SQL here or use separate migration files
  });
}

/**
 * Create per-tenant database connection
 *
 * This is used for per-tenant database isolation strategy.
 * Each tenant gets their own PostgreSQL database.
 *
 * Usage:
 * - Set TENANCY_STRATEGY=per-database in .env
 * - Tenant databases are named: {{DB_NAME}}_tenant_{tenantId}
 */
export async function createTenantPostgresConnection(tenantId: UUID) {
  const config = getPostgresConfig();
  const tenantDatabase = `${config.database}_tenant_${tenantId.replace(/-/g, '_')}`;

  const adminSql = postgres({
    host: config.host,
    port: config.port,
    database: 'postgres',
    user: config.user,
    password: config.password,
    max: 1,
  });

  try {
    // Create tenant database if it doesn't exist
    const existsResult = await adminSql`
      SELECT 1 FROM pg_database WHERE datname = ${tenantDatabase}
    `;

    if (existsResult.length === 0) {
      console.log(`[Postgres] Creating tenant database "${tenantDatabase}"...`);
      await adminSql.unsafe(`CREATE DATABASE "${tenantDatabase}"`);
      console.log(`[Postgres] Tenant database "${tenantDatabase}" created`);
    }
  } finally {
    await adminSql.end();
  }

  // Return connection to tenant database
  return createPostgres({
    host: config.host,
    port: config.port,
    database: tenantDatabase,
    user: config.user,
    password: config.password,
    max: 5, // Fewer connections per tenant
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

/**
 * Tenancy strategy enum
 */
export enum TenancyStrategy {
  SHARED_DATABASE = 'shared-database', // Single DB with tenant_id columns
  PER_DATABASE = 'per-database', // Each tenant gets their own DB
  PER_SCHEMA = 'per-schema', // Each tenant gets their own schema
}

/**
 * Get current tenancy strategy from environment
 */
export function getTenancyStrategy(): TenancyStrategy {
  return (process.env.TENANCY_STRATEGY || TenancyStrategy.SHARED_DATABASE) as TenancyStrategy;
}

