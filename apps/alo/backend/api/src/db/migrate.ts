/**
 * Database migration script
 */

import { createDatabase } from './index.js';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/alo_manager';

async function migrate() {
  console.log('Running database migration...');

  const db = createDatabase(connectionString);

  // Import schema and run migration
  const { createTableSQLString } = await import('./schema.js');

  try {
    await db.execute(createTableSQLString);
    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    process.exit(1);
  }

  await db.client.end();
}

migrate().catch((error) => {
  console.error('Migration error:', error);
  process.exit(1);
});
