/**
 * Database Migration Script
 *
 * Runs Drizzle migrations from the migrations folder
 */

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, close } from './index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  console.log('🔧 Running database migrations...');

  try {
    await migrate(db, { migrationsFolder: join(__dirname, 'migrations') });
    console.log('✅ Migrations completed successfully!');
    console.log('');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await close();
  }
}

// Run migrations
runMigrations().catch((error) => {
  console.error('Failed to run migrations:', error);
  process.exit(1);
});
