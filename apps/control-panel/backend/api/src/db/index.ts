/**
 * Database Connection
 *
 * PostgreSQL database connection using Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../config/index.js';
import * as schema from './schema.js';

// Create connection pool
const pool = postgres({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : undefined,
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Export for raw queries when needed
export { pool };

// Health check
export async function healthCheck(): Promise<boolean> {
  try {
    await pool`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// Graceful shutdown
export async function close(): Promise<void> {
  await pool.end();
}
