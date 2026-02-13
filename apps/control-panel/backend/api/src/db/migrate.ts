/**
 * Database Migration Script
 *
 * For development: Uses drizzle-kit push (idempotent)
 * For production: Uses drizzle migrations
 */

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import postgres from 'postgres';
import { config } from '../config/index.js';
import { spawn } from 'child_process';

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

/**
 * Run drizzle-kit push command (idempotent, creates missing tables)
 */
async function runPush(): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      'pnpm',
      ['db:push'],
      {
        stdio: 'inherit',
        cwd: join(__dirname, '../..'),
        shell: true,
      }
    );

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`drizzle-kit push exited with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

async function runMigrations() {
  console.log('🔧 Running database migrations...');

  try {
    await ensureDatabaseExists();

    // For development, use push which is more idempotent
    // It reads the schema and creates/updates tables as needed
    if (config.env === 'development') {
      console.log('📝 Using drizzle-push (development mode)...');
      await runPush();
    } else {
      // For production, use tracked migrations
      await migrate(db, { migrationsFolder: join(__dirname, 'migrations') });
    }

    console.log('✅ Migrations completed successfully!');
    console.log('');
  } catch (error) {
    // Don't close connection on error - let caller decide
    throw error;
  } finally {
    // Don't close connection - caller will manage it
  }
}

/**
 * Run database migrations
 * Can be imported and called from other modules
 */
export { runMigrations };

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch((error) => {
    console.error('Failed to run migrations:', error);
    process.exit(1);
  });
}
