/**
 * Database seed script
 */

import { createDatabase } from './index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/alo_manager';

async function seed() {
  console.log('Seeding database...');

  const db = createDatabase(connectionString);

  try {
    // Check if data already exists
    const existingTypes = await db.execute('SELECT COUNT(*) as count FROM establishment_types');
    if (Number(existingTypes[0].count) > 0) {
      console.log('Database already seeded, skipping...');
      await db.$client.end();
      return;
    }

    // Seed establishment types
    await db.execute(fs.readFileSync(path.join(__dirname, 'seed_establishment_types.sql'), 'utf-8'));

    // Seed service provider categories
    await db.execute(fs.readFileSync(path.join(__dirname, 'seed_service_categories.sql'), 'utf-8'));

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }

  await db.$client.end();
}

seed().catch((error) => {
  console.error('Seeding error:', error);
  process.exit(1);
});
