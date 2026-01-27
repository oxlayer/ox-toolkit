/**
 * Admin Database Schema for Control Panel
 *
 * This schema defines tables for the admin control panel database,
 * which is separate from tenant databases. It stores:
 * - Realm registry (all provisioned Keycloak realms)
 * - Database registry (mapping of databases to realms/workspaces)
 * - Control panel settings
 */

import { pgTable, uuid, varchar, timestamp, text, jsonb, boolean, index, integer } from 'drizzle-orm/pg-core';

// =============================================================================
// REALMS REGISTRY
// =============================================================================

/**
 * Realms Table
 *
 * Registry of all provisioned Keycloak realms in the system.
 * This table stores metadata about each realm for the control panel.
 */
export const realms = pgTable('realms', {
  id: uuid('id').primaryKey().defaultRandom(),
  realmId: varchar('realm_id', { length: 255 }).notNull().unique(), // e.g., "company-name" (without globex_ prefix)
  realmName: varchar('realm_name', { length: 255 }).notNull().unique(), // e.g., "globex_company-name"
  displayName: varchar('display_name', { length: 255 }).notNull(),
  enabled: boolean('enabled').notNull().default(true),

  // Owner information
  ownerId: varchar('owner_id', { length: 255 }),
  ownerEmail: varchar('owner_email', { length: 255 }),
  ownerFirstName: varchar('owner_first_name', { length: 255 }),
  ownerLastName: varchar('owner_last_name', { length: 255 }),

  // Provisioning metadata
  provisionedAt: timestamp('provisioned_at').notNull().defaultNow(),
  lastSyncedAt: timestamp('last_synced_at'),
  syncStatus: varchar('sync_status', { length: 50 }).default('synced'), // synced, pending, failed

  // Settings
  settings: jsonb('settings').$type<{
    organizationsEnabled?: boolean;
    customDomain?: string;
  }>(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  realmIdIdx: index('idx_realms_realm_id').on(table.realmId),
  enabledIdx: index('idx_realms_enabled').on(table.enabled),
}));

// =============================================================================
// DATABASES REGISTRY
// =============================================================================

/**
 * Databases Table
 *
 * Registry of all tenant databases with their realm/workspace associations.
 * This links databases to realms and workspaces for the control panel.
 */
export const databases = pgTable('databases', {
  id: uuid('id').primaryKey().defaultRandom(),
  databaseName: varchar('database_name', { length: 255 }).notNull().unique(),
  realmId: varchar('realm_id', { length: 255 }).notNull(), // e.g., "company-name" (without globex_ prefix)

  // Workspace information
  workspaceId: uuid('workspace_id').notNull(),
  workspaceName: varchar('workspace_name', { length: 255 }).notNull(),
  domainAliases: jsonb('domain_aliases').$type<string[]>(),

  // Database credentials (for tenant-specific database users)
  dbUser: varchar('db_user', { length: 255 }), // Database username for this tenant
  dbPassword: varchar('db_password', { length: 255 }), // Database password for this tenant (encrypted in production)

  // Database metadata
  size: varchar('size', { length: 50 }), // e.g., "10MB", "100GB"
  tableCount: integer('table_count').default(0),
  lastMigrationAt: timestamp('last_migration_at'),

  // Status
  enabled: boolean('enabled').notNull().default(true),
  status: varchar('status', { length: 50 }).default('active'), // active, inactive, provisioning

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  databaseNameIdx: index('idx_databases_database_name').on(table.databaseName),
  realmIdIdx: index('idx_databases_realm_id').on(table.realmId),
  workspaceIdIdx: index('idx_databases_workspace_id').on(table.workspaceId),
  realmWorkspaceIdx: index('idx_databases_realm_workspace').on(table.realmId, table.workspaceId),
}));

// =============================================================================
// ORGANIZATIONS REGISTRY
// =============================================================================

/**
 * Organizations Table
 *
 * Registry of all Keycloak organizations with their provisioning status.
 * This tracks organizations created within realms for workspace management.
 */
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Link to realm
  realmId: varchar('realm_id', { length: 255 }).notNull(),

  // Link to workspace
  workspaceId: uuid('workspace_id').notNull(),
  workspaceName: varchar('workspace_name', { length: 255 }).notNull(),

  // Keycloak organization info
  keycloakOrganizationId: varchar('keycloak_organization_id', { length: 255 }), // Keycloak's organization ID
  name: varchar('name', { length: 255 }).notNull(), // Organization normalized name (lowercase alphanumeric with hyphens)
  alias: varchar('alias', { length: 255 }), // Organization display name (original name without normalization)

  // Owner assignment
  ownerAssigned: boolean('owner_assigned').notNull().default(false),
  ownerUsername: varchar('owner_username', { length: 255 }),

  // Provisioning status
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, created, failed

  // Error tracking
  lastError: text('last_error'),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  realmIdIdx: index('idx_organizations_realm_id').on(table.realmId),
  workspaceIdIdx: index('idx_organizations_workspace_id').on(table.workspaceId),
  statusIdx: index('idx_organizations_status').on(table.status),
  realmWorkspaceIdx: index('idx_organizations_realm_workspace').on(table.realmId, table.workspaceId),
}));

// =============================================================================
// CONTROL PANEL SETTINGS
// =============================================================================

/**
 * Settings Table
 *
 * Control panel configuration and settings.
 */
export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: jsonb('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  keyIdx: index('idx_settings_key').on(table.key),
}));

// =============================================================================
// SQL FOR TABLE CREATION
// =============================================================================

/**
 * SQL string for creating all admin database tables
 * This is used for bootstrapping the admin database
 */
export const createAdminTableSQLString = `
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
DO $$ BEGIN
  CREATE TYPE sync_status AS ENUM ('synced', 'pending', 'failed');
  CREATE TYPE db_status AS ENUM ('active', 'inactive', 'provisioning');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create realms table
CREATE TABLE IF NOT EXISTS realms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realm_id VARCHAR(255) NOT NULL UNIQUE,
  realm_name VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,

  owner_id VARCHAR(255),
  owner_email VARCHAR(255),
  owner_first_name VARCHAR(255),
  owner_last_name VARCHAR(255),

  provisioned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(50) DEFAULT 'synced',

  settings JSONB,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_realms_realm_id ON realms(realm_id);
CREATE INDEX IF NOT EXISTS idx_realms_enabled ON realms(enabled);

-- Create databases table
CREATE TABLE IF NOT EXISTS databases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  database_name VARCHAR(255) NOT NULL UNIQUE,
  realm_id VARCHAR(255) NOT NULL,

  workspace_id UUID NOT NULL,
  workspace_name VARCHAR(255) NOT NULL,
  domain_aliases JSONB,

  -- Database credentials (for tenant-specific database users)
  db_user VARCHAR(255),
  db_password VARCHAR(255),

  size VARCHAR(50),
  table_count INTEGER DEFAULT 0,
  last_migration_at TIMESTAMP WITH TIME ZONE,

  enabled BOOLEAN NOT NULL DEFAULT true,
  status VARCHAR(50) DEFAULT 'active',

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_databases_database_name ON databases(database_name);
CREATE INDEX IF NOT EXISTS idx_databases_realm_id ON databases(realm_id);
CREATE INDEX IF NOT EXISTS idx_databases_workspace_id ON databases(workspace_id);
CREATE INDEX IF NOT EXISTS idx_databases_realm_workspace ON databases(realm_id, workspace_id);

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  realm_id VARCHAR(255) NOT NULL,
  workspace_id UUID NOT NULL,
  workspace_name VARCHAR(255) NOT NULL,

  keycloak_organization_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  alias VARCHAR(255),

  owner_assigned BOOLEAN NOT NULL DEFAULT false,
  owner_username VARCHAR(255),

  status VARCHAR(50) NOT NULL DEFAULT 'pending',

  last_error TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_realm_id ON organizations(realm_id);
CREATE INDEX IF NOT EXISTS idx_organizations_workspace_id ON organizations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_realm_workspace ON organizations(realm_id, workspace_id);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_realms_updated_at ON realms;
CREATE TRIGGER update_realms_updated_at
  BEFORE UPDATE ON realms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_databases_updated_at ON databases;
CREATE TRIGGER update_databases_updated_at
  BEFORE UPDATE ON databases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO settings (key, value, description)
VALUES
  ('control_panel_version', '"1.0.0"', 'Control panel version'),
  ('organization_feature_enabled', 'true', 'Whether organizations feature is enabled'),
  ('custom_domain_feature_enabled', 'false', 'Whether custom domain feature is enabled')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Add missing columns for database credentials
DO $$
BEGIN
  -- Add db_user if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'databases' AND column_name = 'db_user'
  ) THEN
    ALTER TABLE databases ADD COLUMN db_user VARCHAR(255);
  END IF;

  -- Add db_password if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'databases' AND column_name = 'db_password'
  ) THEN
    ALTER TABLE databases ADD COLUMN db_password VARCHAR(255);
  END IF;
END $$;
`;
