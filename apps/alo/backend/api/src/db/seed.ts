/**
 * Database seed script
 */

import { createDatabase } from './index.js';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/alo_manager';

async function seed() {
  console.log('Seeding database...');

  const db = createDatabase(connectionString);

  try {
    // Check if data already exists
    const existingTypes = await db.execute('SELECT COUNT(*) as count FROM establishment_types');
    if (existingTypes.rows[0].count > 0) {
      console.log('Database already seeded, skipping...');
      await db.client.end();
      return;
    }

    // Seed establishment types
    await db.execute(`
      INSERT INTO establishment_types (name, description, requires_delivery, requires_location, requires_menu, requires_hours) VALUES
      ('Restaurant', 'Food service establishment', true, true, true, true),
      ('Bar', 'Bar and lounge', true, false, true, true),
      ('Cafe', 'Coffee shop', true, false, true, true),
      ('Delivery', 'Delivery-only service', true, true, false, false)
    `);

    // Seed service provider categories
    await db.execute(`
      INSERT INTO service_provider_categories (name, description) VALUES
      ('Cleaning', 'Professional cleaning services'),
      ('Maintenance', 'General maintenance and repairs'),
      ('Delivery', 'Delivery services'),
      ('Security', 'Security services'),
      ('IT Services', 'Information technology services')
    `);

    // Create admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    await db.execute(`
      INSERT INTO users (name, email, password_hash, role) VALUES
      ('Admin User', 'admin@acme.com', $1, 'admin')
    `, [passwordHash]);

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
