/**
 * Database migration script
 *
 * This script runs drizzle migrations manually.
 * Note: Migrations also run automatically on API startup.
 */

import { runMigrations } from './drizzle-migrate.js';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/alo_manager';

async function migrate() {
  console.log('Running database migration...');

  try {
    await runMigrations({ connectionString });
    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    process.exit(1);
  }
}

migrate().catch((error) => {
  console.error('Migration error:', error);
  process.exit(1);
});
