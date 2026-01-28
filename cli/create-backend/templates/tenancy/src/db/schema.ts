/**
 * Database Schema - Multi-Tenant
 *
 * This file defines the database schema using Drizzle ORM for a multi-tenant system.
 * All tenant-aware tables include a tenant_id column for data isolation.
 */

import { pgTable, uuid, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

/**
 * Tenants table
 * System-level table storing all tenants
 */
export const tenants = pgTable('tenants', {
  tenantId: uuid('tenant_id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  domain: text('domain').notNull().unique(),
  status: text('status').notNull().default('active'), // active, inactive, suspended
  maxUsers: integer('max_users').notNull().default(100),
  maxStorageGB: integer('max_storage_gb').notNull().default(10),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Items table - Tenant Aware
 * All items belong to a specific tenant
 */
export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.tenantId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  quantity: integer('quantity').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Index for tenant_id on items table (improves query performance)
 */
export const itemsTenantIdIndex = pgTable('items_tenant_id_idx', {
  tenantId: uuid('tenant_id').notNull(),
});

/**
 * SQL for creating the tenants table
 */
export const createTenantsTableSQL = `
CREATE TABLE IF NOT EXISTS tenants (
  tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  max_users INTEGER NOT NULL DEFAULT 100,
  max_storage_gb INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
`;

/**
 * SQL for creating the items table with tenant_id
 */
export const createItemsTableSQL = `
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_items_tenant_id ON items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_items_tenant_name ON items(tenant_id, name);
`;

/**
 * Combined SQL string for all tables
 */
export const createTableSQLString = `
${createTenantsTableSQL}

${createItemsTableSQL}
`;

/**
 * Add your tables below this line
 */

// export const yourTable = pgTable('your_table', {
//   id: uuid('id').primaryKey().defaultRandom(),
//   tenantId: uuid('tenant_id').notNull().references(() => tenants.tenantId),
//   // ...
// });
