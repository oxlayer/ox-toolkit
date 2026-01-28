/**
 * Drizzle Migration Runner
 *
 * Runs migrations using drizzle-kit programmatically
 */

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface MigrateOptions {
  connectionString: string;
}

/**
 * Run pending migrations
 */
export async function runMigrations(options: MigrateOptions): Promise<void> {
  const { connectionString } = options;

  const connection = postgres(connectionString, { max: 1 });
  const db = drizzle(connection, { schema });

  // Use absolute path to migrations folder
  const migrationsFolder = join(__dirname, '../../drizzle');

  console.log('[Drizzle] Running migrations...');
  console.log('[Drizzle] Migrations folder:', migrationsFolder);

  try {
    await migrate(db, { migrationsFolder });
    console.log('[Drizzle] ✅ Migrations completed successfully');
  } catch (error) {
    console.error('[Drizzle] ❌ Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}
