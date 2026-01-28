/**
 * Database seed script
 */

import { createDatabase } from './index.js';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/{{DB_NAME}}';

async function seed() {
  console.log('Seeding database...');

  const db = createDatabase(connectionString);

  try {
    // Check if data already exists
    const existingItems = await db.execute('SELECT COUNT(*) as count FROM items');
    if (existingItems.rows[0].count > 0) {
      console.log('Database already seeded, skipping...');
      await db.client.end();
      return;
    }

    // Seed example items
    await db.execute(`
      INSERT INTO items (name, description) VALUES
      ('First Item', 'This is the first item'),
      ('Second Item', 'This is the second item'),
      ('Third Item', 'This is the third item')
    `);

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }

  await db.client.end();
}

seed().catch((error) => {
  console.error('Seeding error:', error);
  process.exit(1);
});
