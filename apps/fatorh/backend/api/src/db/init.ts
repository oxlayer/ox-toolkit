/**
 * Database Initialization Script
 *
 * Creates the fator_h database if it doesn't exist.
 * This should be run before starting the application.
 */

import postgres from 'postgres';
import { ENV } from '../config/app.config.js';

/**
 * Initialize the database by creating it if it doesn't exist
 */
export async function initDatabase(): Promise<void> {
  // Connect to postgres default database to create fator_h database
  const sql = postgres({
    host: ENV.POSTGRES_HOST,
    port: ENV.POSTGRES_PORT,
    database: 'postgres', // Connect to default database
    username: ENV.POSTGRES_USER,
    password: ENV.POSTGRES_PASSWORD,
  });

  try {
    console.log(`🔍 Checking if database '${ENV.POSTGRES_DATABASE}' exists...`);

    // Check if database exists
    const result = await sql`
      SELECT 1 FROM pg_database WHERE datname = ${ENV.POSTGRES_DATABASE}
    `;

    if (result.length === 0) {
      console.log(`➕ Creating database '${ENV.POSTGRES_DATABASE}'...`);
      await sql.unsafe(`CREATE DATABASE ${ENV.POSTGRES_DATABASE}`);
      console.log(`✅ Database '${ENV.POSTGRES_DATABASE}' created successfully!`);
    } else {
      console.log(`✅ Database '${ENV.POSTGRES_DATABASE}' already exists.`);
    }
  } catch (error) {
    console.error(`❌ Failed to initialize database:`, error);
    throw error;
  } finally {
    await sql.end();
  }
}

/**
 * Run database initialization if called directly
 */
if (import.meta.main) {
  await initDatabase()
    .then(() => {
      console.log('✅ Database initialization complete.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database initialization failed:', error);
      process.exit(1);
    });
}
