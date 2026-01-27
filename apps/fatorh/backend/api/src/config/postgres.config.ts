// /**
//  * PostgreSQL Configuration with Tenancy
//  */

// import { drizzle } from 'drizzle-orm/postgres-js';
// import postgres from 'postgres';
// import { ENV } from './app.config.js';

// /**
//  * PostgreSQL connection interface
//  */
// export interface PostgresConnection {
//   client: postgres.Sql<NonNullable<unknown>>;
//   drizzle: ReturnType<typeof drizzle>;
//   query: (sql: string, params?: any[]) => Promise<any>;
//   close: () => Promise<void>;
// }

// /**
//  * Create shared PostgreSQL connection
//  */
// export function createPostgresConnection(): PostgresConnection {
//   const client = postgres(ENV.DATABASE_URL, {
//     max: 20, // Connection pool size
//     idle_timeout: 30, // Idle timeout in seconds
//     connect_timeout: 10, // Connection timeout in seconds
//   });

//   const drizzleClient = drizzle(client);

//   return {
//     client,
//     drizzle: drizzleClient,
//     query: async (sql: string, params?: any[]) => {
//       return client.unsafe(sql, params);
//     },
//     close: async () => {
//       await client.end();
//     },
//   };
// }

// /**
//  * Create tenancy-aware PostgreSQL with RLS
//  *
//  * This integrates with the oxlayer tenancy system to provide:
//  * - Automatic tenant_id column management
//  * - Row-Level Security (RLS)
//  * - Tenant isolation for all queries
//  */
// export async function createTenancyPostgres(tenantResolver: any, sharedDb: PostgresConnection) {
//   // For now, return the shared connection
//   // TODO: Integrate with @oxlayer/pro-adapters-postgres-tenancy
//   return {
//     connection: sharedDb,
//     enableRLS: async () => {
//       // Enable RLS on all tables
//       // This would be done via migrations
//     },
//   };
// }


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
