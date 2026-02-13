/**
 * Database Migration Script
 *
 * Runs Drizzle migrations from the migrations folder
 */

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, close } from './index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import postgres from 'postgres';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Creates the database if it doesn't exist
 */
async function ensureDatabaseExists(): Promise<void> {
  // Connect to postgres default database to create our database
  const sql = postgres({
    host: config.database.host,
    port: config.database.port,
    database: 'postgres', // Connect to default database
    user: config.database.user,
    password: config.database.password,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : undefined,
    max: 1,
  });

  try {
    const dbName = config.database.database;
    console.log(`🔍 Checking if database "${dbName}" exists...`);

    const result = await sql`
      SELECT 1 FROM pg_database WHERE datname = ${dbName}
    `;

    if (result.length === 0) {
      console.log(`📦 Creating database "${dbName}"...`);
      await sql.unsafe(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully!`);
    } else {
      console.log(`✅ Database "${dbName}" already exists.`);
    }
  } finally {
    await sql.end();
  }
}

async function runMigrations() {
  console.log('🔧 Running database migrations...');

  try {
    await ensureDatabaseExists();
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
