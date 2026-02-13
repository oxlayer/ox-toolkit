/**
 * Drizzle Schema for Control Panel
 *
 * PostgreSQL schema definitions using Drizzle ORM
 */

import {
  pgTable,
  pgEnum,
  text,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Enums
export const licenseTierEnum = pgEnum('license_tier', ['starter', 'professional', 'enterprise', 'custom']);
export const licenseStatusEnum = pgEnum('license_status', ['active', 'suspended', 'expired', 'revoked']);
export const apiKeyStatusEnum = pgEnum('api_key_status', ['active', 'revoked', 'expired']);
export const apiKeyScopeEnum = pgEnum('api_key_scope', ['read', 'write', 'admin', 'install']);
export const environmentEnum = pgEnum('environment', ['development', 'staging', 'production']);
export const sdkPackageTypeEnum = pgEnum('sdk_package_type', ['backend-sdk', 'frontend-sdk', 'cli-tools', 'channels']);
export const deviceSessionStatusEnum = pgEnum('device_session_status', ['pending', 'approved', 'expired', 'revoked']);

// Organizations
export const organizations = pgTable(
  'organizations',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    tier: licenseTierEnum('tier').notNull().default('starter'),
    maxDevelopers: integer('max_developers').notNull().default(5),
    maxProjects: integer('max_projects').notNull().default(3),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: index('idx_organizations_slug').on(table.slug),
    tierIdx: index('idx_organizations_tier').on(table.tier),
  })
);

// Developers
export const developers = pgTable(
  'developers',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    environments: jsonb('environments').notNull().default(JSON.stringify(['development'])),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    organizationIdIdx: index('idx_developers_organization_id').on(table.organizationId),
    emailIdx: index('idx_developers_email').on(table.email),
  })
);

// Licenses
export const licenses = pgTable(
  'licenses',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    tier: licenseTierEnum('tier').notNull().default('starter'),
    status: licenseStatusEnum('status').notNull().default('active'),
    packages: jsonb('packages').notNull().default(JSON.stringify([])),
    capabilities: jsonb('capabilities').notNull().default('{}'),
    environments: jsonb('environments').notNull().default(JSON.stringify(['development'])),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    organizationIdIdx: index('idx_licenses_organization_id').on(table.organizationId),
    statusIdx: index('idx_licenses_status').on(table.status),
    expiresAtIdx: index('idx_licenses_expires_at').on(table.expiresAt),
  })
);

// API Keys
export const apiKeys = pgTable(
  'api_keys',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    developerId: text('developer_id').references(() => developers.id, { onDelete: 'set null' }),
    licenseId: text('license_id').notNull().references(() => licenses.id, { onDelete: 'cascade' }),
    keyHash: text('key_hash').notNull(),
    keyPrefix: text('key_prefix').notNull(),
    name: text('name').notNull(),
    scopes: jsonb('scopes').notNull().default(JSON.stringify(['read'])),
    environments: jsonb('environments').notNull().default(JSON.stringify(['development'])),
    status: apiKeyStatusEnum('status').notNull().default('active'),
    lastUsedAt: timestamp('last_used_at'),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    organizationIdIdx: index('idx_api_keys_organization_id').on(table.organizationId),
    developerIdIdx: index('idx_api_keys_developer_id').on(table.developerId),
    licenseIdIdx: index('idx_api_keys_license_id').on(table.licenseId),
    keyHashIdx: index('idx_api_keys_key_hash').on(table.keyHash),
    statusIdx: index('idx_api_keys_status').on(table.status),
    keyHashUnique: uniqueIndex('idx_api_keys_key_hash_unique').on(table.keyHash),
  })
);

// Usage Logs (optional, for analytics)
export const usageLogs = pgTable(
  'usage_logs',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    licenseId: text('license_id').references(() => licenses.id, { onDelete: 'set null' }),
    apiKeyId: text('api_key_id').references(() => apiKeys.id, { onDelete: 'set null' }),
    endpoint: text('endpoint').notNull(),
    environment: text('environment').notNull(),
    capabilitiesRequested: jsonb('capabilities_requested').notNull().default(JSON.stringify([])),
    resolvedAt: timestamp('resolved_at').notNull().defaultNow(),
  },
  (table) => ({
    organizationIdIdx: index('idx_usage_logs_organization_id').on(table.organizationId),
    licenseIdIdx: index('idx_usage_logs_license_id').on(table.licenseId),
    resolvedAtIdx: index('idx_usage_logs_resolved_at').on(table.resolvedAt),
  })
);

// Type exports
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type Developer = typeof developers.$inferSelect;
export type NewDeveloper = typeof developers.$inferInsert;

export type License = typeof licenses.$inferSelect;
export type NewLicense = typeof licenses.$inferInsert;

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;

// Device Sessions
export const deviceSessions = pgTable(
  'device_sessions',
  {
    id: text('id').primaryKey(),
    deviceCode: text('device_code').notNull().unique(),
    userCode: text('user_code').notNull().unique(),
    organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
    developerId: text('developer_id').references(() => developers.id, { onDelete: 'set null' }),
    deviceName: text('device_name').notNull(),
    environment: environmentEnum('environment').notNull(),
    status: deviceSessionStatusEnum('status').notNull().default('pending'),
    scopes: jsonb('scopes').notNull().default(JSON.stringify(['read', 'install'])),
    expiresAt: timestamp('expires_at').notNull(),
    approvedAt: timestamp('approved_at'),
    approvedBy: text('approved_by').references(() => developers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    deviceCodeIdx: index('idx_device_sessions_device_code').on(table.deviceCode),
    userCodeIdx: index('idx_device_sessions_user_code').on(table.userCode),
    organizationIdIdx: index('idx_device_sessions_organization_id').on(table.organizationId),
    expiresAtIdx: index('idx_device_sessions_expires_at').on(table.expiresAt),
    statusIdx: index('idx_device_sessions_status').on(table.status),
  })
);

export type DeviceSession = typeof deviceSessions.$inferSelect;
export type NewDeviceSession = typeof deviceSessions.$inferInsert;

export type UsageLog = typeof usageLogs.$inferSelect;
export type NewUsageLog = typeof usageLogs.$inferInsert;
