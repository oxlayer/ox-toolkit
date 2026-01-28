/**
 * Database seed script - Multi-Tenant
 *
 * Seeds tenants and sample data for development/testing.
 */

import { createDatabase } from './index.js';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/{{DB_NAME}}';

async function seed() {
  console.log('Seeding database...');

  const db = createDatabase(connectionString);

  try {
    // Check if tenants already exist
    const existingTenants = await db.execute('SELECT COUNT(*) as count FROM tenants');
    if (existingTenants.rows[0].count > 0) {
      console.log('Database already seeded, skipping...');
      await db.client.end();
      return;
    }

    // Seed tenants
    console.log('Seeding tenants...');
    await db.execute(`
      INSERT INTO tenants (tenant_id, name, domain, status, max_users, max_storage_gb) VALUES
      ('550e8400-e29b-41d4-a716-446655440001', 'Acme Corporation', 'acme', 'active', 100, 10),
      ('550e8400-e29b-41d4-a716-446655440002', 'Globex Inc', 'globex', 'active', 200, 20),
      ('550e8400-e29b-41d4-a716-446655440003', 'Soylent Corp', 'soylent', 'active', 50, 5)
    `);

    // Seed items for each tenant
    console.log('Seeding items for tenants...');

    const acmeTenantId = '550e8400-e29b-41d4-a716-446655440001';
    const globexTenantId = '550e8400-e29b-41d4-a716-446655440002';
    const soylentTenantId = '550e8400-e29b-41d4-a716-446655440003';

    await db.execute(`
      INSERT INTO items (id, tenant_id, name, description, quantity) VALUES
      ('650e8400-e29b-41d4-a716-446655440001', '${acmeTenantId}', 'Product A', 'Acme product A', 100),
      ('650e8400-e29b-41d4-a716-446655440002', '${acmeTenantId}', 'Product B', 'Acme product B', 50),
      ('650e8400-e29b-41d4-a716-446655440003', '${globexTenantId}', 'Service X', 'Globex service X', 25),
      ('650e8400-e29b-41d4-a716-446655440004', '${globexTenantId}', 'Service Y', 'Globex service Y', 75),
      ('650e8400-e29b-41d4-a716-446655440005', '${soylentTenantId}', 'Ingredient Z', 'Soylent ingredient Z', 500)
    `);

    console.log('✅ Database seeded successfully');
    console.log('   - 3 tenants created');
    console.log('   - 5 items created across tenants');
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
