/**
 * PostgreSQL Configuration
 */

import { createPostgres } from '@oxlayer/capabilities-adapters-postgres';
import { ENV } from './app.config.js';
import { createTableSQLString } from '../db/schema.js';

/**
 * Create PostgreSQL connection with auto-migration
 */
export function createPostgresConnection() {
  return createPostgres({
    host: ENV.POSTGRES_HOST,
    port: ENV.POSTGRES_PORT,
    database: ENV.POSTGRES_DATABASE,
    user: ENV.POSTGRES_USER,
    password: ENV.POSTGRES_PASSWORD,
    max: 20,
    idle_timeout: 30,
    connect_timeout: 10,
    migrationSQL: createTableSQLString,
  });
}
