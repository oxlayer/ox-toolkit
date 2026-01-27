/**
 * Admin Database Configuration
 *
 * Separate database for the control panel (admin app).
 * This database stores:
 * - Realms registry (all provisioned Keycloak realms)
 * - Database registry (mapping databases to realms/workspaces)
 * - Control panel settings
 *
 * Environment variables:
 * - POSTGRES_ADMIN_HOST: Admin database host (defaults to POSTGRES_HOST)
 * - POSTGRES_ADMIN_PORT: Admin database port (defaults to POSTGRES_PORT)
 * - POSTGRES_ADMIN_USER: Admin database user (defaults to POSTGRES_USER)
 * - POSTGRES_ADMIN_PASSWORD: Admin database password (defaults to POSTGRES_PASSWORD)
 * - POSTGRES_ADMIN_DATABASE: Admin database name (defaults to 'globex_admin')
 *
 * @example
 * ```ts
 * import { getAdminDb } from './config/admin-db.config';
 *
 * const adminDb = getAdminDb();
 * const realms = await adminDb.select().from(realms);
 * ```
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { ENV } from './app.config.js';
import * as schema from '../db/admin-schema.js';

/**
 * Get admin database configuration
 * Supports separate admin credentials via POSTGRES_ADMIN_* environment variables
 */
function getAdminConfig() {
  return {
    host: ENV.POSTGRES_ADMIN_HOST || ENV.POSTGRES_HOST || 'localhost',
    port: Number(ENV.POSTGRES_ADMIN_PORT || ENV.POSTGRES_PORT) || 5432,
    user: ENV.POSTGRES_ADMIN_USER || ENV.POSTGRES_USER || 'postgres',
    password: ENV.POSTGRES_ADMIN_PASSWORD || ENV.POSTGRES_PASSWORD || 'postgres',
    database: ENV.POSTGRES_ADMIN_DATABASE || 'globex_admin',
  };
}

/**
 * Get master postgres connection for admin operations
 * Connects to 'postgres' database to CREATE DATABASE
 * Uses admin credentials for database creation
 */
function getMasterConnection() {
  const config = getAdminConfig();

  // Connect to 'postgres' database for admin operations
  return postgres({
    host: config.host,
    port: config.port,
    database: 'postgres',
    user: config.user,
    password: config.password,
    max: 1,
  });
}

/**
 * Admin database connection
 * This is a separate database from tenant databases, used only by the control panel
 */
let adminDbInstance: ReturnType<typeof drizzle<typeof postgres>> | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Get admin database connection (singleton)
 * Ensures database exists before connecting
 */
export async function getAdminDb() {
  if (!adminDbInstance) {
    const config = getAdminConfig();

    // First ensure the database exists
    if (!initPromise) {
      initPromise = initAdminDatabaseInternal(config);
    }
    await initPromise;

    // Then create the connection
    const client = postgres({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: 10, // Smaller pool for admin operations
      idle_timeout: 30,
      connect_timeout: 10,
    });

    adminDbInstance = drizzle(client, { schema: schema });
  }

  return adminDbInstance;
}

/**
 * Initialize admin database internally
 * Creates the database and tables if they don't exist
 */
async function initAdminDatabaseInternal(config: ReturnType<typeof getAdminConfig>) {
  try {
    // First ensure the database exists
    await ensureAdminDatabaseExistsInternal(config);

    // Then create tables using a temporary connection
    const tempClient = postgres({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: 1,
    });

    try {
      const { createAdminTableSQLString } = await import('../db/admin-schema.js');

      // Execute the entire SQL as a single batch
      // postgres library supports multiple statements in one call
      try {
        await tempClient.unsafe(createAdminTableSQLString);
      } catch (err: any) {
        // Ignore errors for existing tables/constraints
        if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
          console.warn('Admin DB init warning:', err.message);
        }
      }

      console.log('✅ Admin database tables initialized');
    } finally {
      await tempClient.end();
    }
  } catch (err) {
    console.error('Failed to initialize admin database:', err);
    throw err;
  }
}

/**
 * Ensure admin database exists (internal version with config parameter)
 */
async function ensureAdminDatabaseExistsInternal(config: ReturnType<typeof getAdminConfig>) {
  const sql = getMasterConnection();

  try {
    // Check if database exists
    const result = await sql.unsafe(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [config.database]);

    if (result.length === 0) {
      // Create database
      await sql.unsafe(`CREATE DATABASE "${config.database}" ENCODING 'UTF8'`);
      console.log(`✅ Created admin database: ${config.database}`);
    } else {
      console.log(`ℹ️  Admin database already exists: ${config.database}`);
    }
  } catch (err: any) {
    console.error('Failed to ensure admin database exists:', err);
    throw err;
  } finally {
    await sql.end();
  }
}

/**
 * Close admin database connection
 */
export async function closeAdminDb() {
  if (adminDbInstance) {
    await adminDbInstance.$client.end();
    adminDbInstance = null;
    initPromise = null;
  }
}

/**
 * Reset admin database cache and force reinitialization
 * Use this when the schema has been updated (e.g., new tables added)
 */
export async function resetAdminDbCache() {
  await closeAdminDb();
  // Clear module cache for admin-schema to ensure latest schema is loaded
  const schemaPath = new URL('../db/admin-schema.js', import.meta.url).href;
  delete (globalThis as any).__drizzle_module_cache?.[schemaPath];
}

/**
 * Initialize admin database on application startup
 * Creates the database and tables if they don't exist
 * Call this function when the application starts to ensure the admin DB is ready
 */
export async function initAdminDbOnStartup(): Promise<void> {
  const config = getAdminConfig();

  if (!initPromise) {
    initPromise = initAdminDatabaseInternal(config);
  }

  await initPromise;
}
