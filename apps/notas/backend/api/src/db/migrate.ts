/**
 * Database Migration Script
 *
 * Run this to create all tables for Legend todo app:
 * pnpm run db:migrate
 *
 * Note: Auto-migration runs automatically via the postgres adapter
 * This script is provided for manual migrations if needed.
 */

import { createPostgresConnection } from '../config/postgres.config.js';
import { createTableSQLString } from './schema.js';

async function migrate() {
  console.log('🔄 Running database migration...');

  const pg = createPostgresConnection();

  try {
    // Check if we can connect
    await pg.sql`SELECT 1`;
    console.log('✅ Connected to database');

    // Run migration
    await pg.sql.unsafe(createTableSQLString);
    console.log('✅ Migration completed successfully');
    console.log('');
    console.log('Created tables:');
    console.log('  - workspaces (multi-workspace support)');
    console.log('  - contacts (CRM)');
    console.log('  - companies (CRM)');
    console.log('  - deals (CRM)');
    console.log('  - candidates (Recruiting)');
    console.log('  - positions (Recruiting)');
    console.log('  - pipeline_stages (configurable pipelines)');
    console.log('  - projects (task organization)');
    console.log('  - sections (sub-groups within projects)');
    console.log('  - todos (with workspace and optional CRM context)');
    console.log('');
    console.log('Created indexes for efficient queries');
    console.log('Created triggers for automatic updated_at');

    // Create default workspace if it doesn't exist
    const defaultWorkspaceExists = await pg.sql`
      SELECT id FROM workspaces WHERE id = 'default'
    `;

    if (defaultWorkspaceExists.length === 0) {
      await pg.sql`
        INSERT INTO workspaces (id, name, type, owner_id, flags, created_at, updated_at)
        VALUES ('default', 'Default Workspace', 'personal', 'system', '{}', NOW(), NOW())
      `;
      console.log('✅ Created default workspace');
    } else {
      console.log('ℹ️  Default workspace already exists');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pg.close();
  }
}

migrate();
