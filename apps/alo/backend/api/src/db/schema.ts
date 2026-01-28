/**
 * Database Schema for Alo Manager API
 *
 * Manages establishments, users, delivery men, service providers, and onboarding leads
 */

import { pgTable, text, timestamp, integer, boolean, jsonb, numeric } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Establishment Types Table
 *
 * Defines the types of establishments (restaurant, bar, cafe, etc.)
 */
export const EstablishmentType = pgTable('establishment_types', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  name: text('name').notNull(),
  description: text('description'),
  requiresDelivery: boolean('requires_delivery').notNull().default(false),
  requiresLocation: boolean('requires_location').notNull().default(false),
  requiresMenu: boolean('requires_menu').notNull().default(false),
  requiresHours: boolean('requires_hours').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Establishments Table
 *
 * Partner establishments in the Alo platform
 */
export const Establishment = pgTable('establishments', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  name: text('name').notNull(),
  horarioFuncionamento: text('horario_funcionamento').notNull(),
  description: text('description').notNull(),
  ownerId: integer('owner_id').notNull(),
  image: text('image').notNull().default(''),
  primaryColor: text('primary_color').notNull().default('#000000'),
  secondaryColor: text('secondary_color').notNull().default('#000000'),
  lat: numeric('lat'),
  long: numeric('long'),
  locationString: text('location_string'),
  maxDistanceDelivery: integer('max_distance_delivery'),
  establishmentTypeId: integer('establishment_type_id').references(() => EstablishmentType.id, { onDelete: 'set null' }),
  website: text('website'),
  whatsapp: text('whatsapp'),
  instagram: text('instagram'),
  googleBusinessUrl: text('google_business_url'),
  openData: jsonb('open_data').notNull().default('{}'),
  // Onboarding fields
  logo: text('logo'), // URL to logo image
  legalName: text('legal_name'), // Razão social (for businesses)
  businessType: text('business_type', { enum: ['me', 'mei', null] }), // ME or MEI
  // Address fields
  zipCode: text('zip_code'), // CEP
  address: text('address'), // Street address
  addressNumber: text('address_number'), // Number
  addressComplement: text('address_complement'), // Complement (apartment, etc.)
  neighborhood: text('neighborhood'),
  city: text('city'),
  state: text('state'), // UF (2 letters)
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Users Table
 *
 * System users (admins, managers, staff)
 */
export const User = pgTable('users', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  establishmentId: integer('establishment_id').references(() => Establishment.id, { onDelete: 'set null' }),
  role: text('role', { enum: ['admin', 'manager', 'staff'] }).notNull().default('staff'),
  isActive: boolean('is_active').notNull().default(true),
  // Onboarding fields
  status: text('status', { enum: ['pending_review', 'active', 'suspended'] }).notNull().default('pending_review'),
  documentType: text('document_type', { enum: ['cpf', 'cnpj'] }),
  document: text('document'), // CPF or CNPJ (unique but nullable for existing users)
  keycloakId: text('keycloak_id'), // Reference to Keycloak user
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Delivery Men Table
 *
 * Delivery personnel for establishments
 */
export const DeliveryMan = pgTable('delivery_men', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  phone: text('phone').notNull(),
  establishmentId: integer('establishment_id').references(() => Establishment.id, { onDelete: 'set null' }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Service Provider Categories Table
 *
 * Categories for service providers (cleaning, maintenance, etc.)
 */
export const ServiceProviderCategory = pgTable('service_provider_categories', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Service Providers Table
 *
 * Third-party service providers (cleaning, maintenance, etc.)
 */
export const ServiceProvider = pgTable('service_providers', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  phone: text('phone').notNull(),
  categoryId: integer('category_id').references(() => ServiceProviderCategory.id, { onDelete: 'set null' }),
  document: text('document').notNull(), // CPF/CNPJ
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: text('zip_code').notNull(),
  available: boolean('available').notNull().default(true),
  rating: integer('rating'), // 1-5 stars
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Service Catalog Items Table
 *
 * Services offered by service providers
 */
export const ServiceCatalogItem = pgTable('service_catalog_items', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  providerId: integer('provider_id').notNull().references(() => ServiceProvider.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(), // Stored as cents (integer)
  estimatedDuration: integer('estimated_duration').notNull(), // in minutes
  active: boolean('active').notNull().default(true),
  image: text('image'),
  stock: integer('stock'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Service Provider Orders Table
 *
 * Orders placed for service provider services
 */
export const ServiceProviderOrder = pgTable('service_provider_orders', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  providerId: integer('provider_id').notNull().references(() => ServiceProvider.id, { onDelete: 'cascade' }),
  catalogItemId: integer('catalog_item_id').notNull().references(() => ServiceCatalogItem.id, { onDelete: 'restrict' }),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerAddress: text('customer_address').notNull(),
  scheduledDate: timestamp('scheduled_date'),
  status: text('status', { enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] }).notNull().default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Onboarding Leads Table
 *
 * Leads from onboarding flow (new providers or companies)
 */
export const OnboardingLead = pgTable('onboarding_leads', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userType: text('user_type', { enum: ['provider', 'company'] }).notNull(),
  categoryId: integer('category_id').references(() => ServiceProviderCategory.id, { onDelete: 'set null' }),
  establishmentTypeId: integer('establishment_type_id').references(() => EstablishmentType.id, { onDelete: 'set null' }),
  document: text('document').notNull(),
  email: text('email').notNull(),
  name: text('name'),
  phone: text('phone').notNull(),
  termsAccepted: boolean('terms_accepted').notNull().default(false),
  privacyAccepted: boolean('privacy_accepted').notNull().default(false),
  status: text('status', { enum: ['new', 'contacted', 'converted', 'rejected'] }).notNull().default('new'),
  contactedAt: timestamp('contacted_at'),
  notes: text('notes'),
  metadata: jsonb('metadata').notNull().default('{}'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Type exports
 */
export type EstablishmentType = typeof EstablishmentType.$inferSelect;
export type NewEstablishmentType = typeof EstablishmentType.$inferInsert;

export type Establishment = typeof Establishment.$inferSelect;
export type NewEstablishment = typeof Establishment.$inferInsert;

export type User = typeof User.$inferSelect;
export type NewUser = typeof User.$inferInsert;

export type DeliveryMan = typeof DeliveryMan.$inferSelect;
export type NewDeliveryMan = typeof DeliveryMan.$inferInsert;

export type ServiceProviderCategory = typeof ServiceProviderCategory.$inferSelect;
export type NewServiceProviderCategory = typeof ServiceProviderCategory.$inferInsert;

export type ServiceProvider = typeof ServiceProvider.$inferSelect;
export type NewServiceProvider = typeof ServiceProvider.$inferInsert;

export type ServiceCatalogItem = typeof ServiceCatalogItem.$inferSelect;
export type NewServiceCatalogItem = typeof ServiceCatalogItem.$inferInsert;

export type ServiceProviderOrder = typeof ServiceProviderOrder.$inferSelect;
export type NewServiceProviderOrder = typeof ServiceProviderOrder.$inferInsert;

export type OnboardingLead = typeof OnboardingLead.$inferSelect;
export type NewOnboardingLead = typeof OnboardingLead.$inferInsert;

/**
 * Migration SQL (string version for auto-migration)
 *
 * This is used by the postgres adapter's auto-migration feature.
 */
export const createTableSQLString = `
-- Establishment Types table
CREATE TABLE IF NOT EXISTS establishment_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  requires_delivery BOOLEAN NOT NULL DEFAULT FALSE,
  requires_location BOOLEAN NOT NULL DEFAULT FALSE,
  requires_menu BOOLEAN NOT NULL DEFAULT FALSE,
  requires_hours BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Establishments table
CREATE TABLE IF NOT EXISTS establishments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  horario_funcionamento TEXT NOT NULL,
  description TEXT NOT NULL,
  owner_id INTEGER NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  primary_color TEXT NOT NULL DEFAULT '#000000',
  secondary_color TEXT NOT NULL DEFAULT '#000000',
  lat NUMERIC,
  long NUMERIC,
  location_string TEXT,
  max_distance_delivery INTEGER,
  establishment_type_id INTEGER REFERENCES establishment_types(id) ON DELETE SET NULL,
  website TEXT,
  whatsapp TEXT,
  instagram TEXT,
  google_business_url TEXT,
  open_data JSONB NOT NULL DEFAULT '{}',
  logo TEXT,
  legal_name TEXT,
  business_type TEXT CHECK (business_type IN ('me', 'mei')),
  zip_code TEXT,
  address TEXT,
  address_number TEXT,
  address_complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  establishment_id INTEGER REFERENCES establishments(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'active', 'suspended')),
  document_type TEXT CHECK (document_type IN ('cpf', 'cnpj')),
  document TEXT,
  keycloak_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Delivery Men table
CREATE TABLE IF NOT EXISTS delivery_men (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT NOT NULL,
  establishment_id INTEGER REFERENCES establishments(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Service Provider Categories table
CREATE TABLE IF NOT EXISTS service_provider_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Service Providers table
CREATE TABLE IF NOT EXISTS service_providers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT NOT NULL,
  category_id INTEGER REFERENCES service_provider_categories(id) ON DELETE SET NULL,
  document TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Service Catalog Items table
CREATE TABLE IF NOT EXISTS service_catalog_items (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  estimated_duration INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  image TEXT,
  stock INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Service Provider Orders table
CREATE TABLE IF NOT EXISTS service_provider_orders (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  catalog_item_id INTEGER NOT NULL REFERENCES service_catalog_items(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  scheduled_date TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Onboarding Leads table
CREATE TABLE IF NOT EXISTS onboarding_leads (
  id SERIAL PRIMARY KEY,
  user_type TEXT NOT NULL CHECK (user_type IN ('provider', 'company')),
  category_id INTEGER REFERENCES service_provider_categories(id) ON DELETE SET NULL,
  establishment_type_id INTEGER REFERENCES establishment_types(id) ON DELETE SET NULL,
  document TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT NOT NULL,
  terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  privacy_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'rejected')),
  contacted_at TIMESTAMP,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_establishments_owner_id ON establishments(owner_id);
CREATE INDEX IF NOT EXISTS idx_establishments_type_id ON establishments(establishment_type_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_establishment_id ON users(establishment_id);
CREATE INDEX IF NOT EXISTS idx_delivery_men_email ON delivery_men(email);
CREATE INDEX IF NOT EXISTS idx_delivery_men_establishment_id ON delivery_men(establishment_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_email ON service_providers(email);
CREATE INDEX IF NOT EXISTS idx_service_providers_category_id ON service_providers(category_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_status ON service_providers(available, is_active);
CREATE INDEX IF NOT EXISTS idx_service_catalog_items_provider_id ON service_catalog_items(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_catalog_items_active ON service_catalog_items(active);
CREATE INDEX IF NOT EXISTS idx_service_provider_orders_provider_id ON service_provider_orders(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_provider_orders_status ON service_provider_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_provider_orders_scheduled_date ON service_provider_orders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_onboarding_leads_status ON onboarding_leads(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_leads_user_type ON onboarding_leads(user_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_leads_email ON onboarding_leads(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
DROP TRIGGER IF EXISTS update_establishment_types_updated_at ON establishment_types;
CREATE TRIGGER update_establishment_types_updated_at
  BEFORE UPDATE ON establishment_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_establishments_updated_at ON establishments;
CREATE TRIGGER update_establishments_updated_at
  BEFORE UPDATE ON establishments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_delivery_men_updated_at ON delivery_men;
CREATE TRIGGER update_delivery_men_updated_at
  BEFORE UPDATE ON delivery_men
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_provider_categories_updated_at ON service_provider_categories;
CREATE TRIGGER update_service_provider_categories_updated_at
  BEFORE UPDATE ON service_provider_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_providers_updated_at ON service_providers;
CREATE TRIGGER update_service_providers_updated_at
  BEFORE UPDATE ON service_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_catalog_items_updated_at ON service_catalog_items;
CREATE TRIGGER update_service_catalog_items_updated_at
  BEFORE UPDATE ON service_catalog_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_provider_orders_updated_at ON service_provider_orders;
CREATE TRIGGER update_service_provider_orders_updated_at
  BEFORE UPDATE ON service_provider_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_onboarding_leads_updated_at ON onboarding_leads;
CREATE TRIGGER update_onboarding_leads_updated_at
  BEFORE UPDATE ON onboarding_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

/**
 * Drop Table SQL
 */
export const dropTableSQL = sql`
DROP TABLE IF EXISTS service_provider_orders CASCADE;
DROP TABLE IF EXISTS service_catalog_items CASCADE;
DROP TABLE IF EXISTS service_providers CASCADE;
DROP TABLE IF EXISTS service_provider_categories CASCADE;
DROP TABLE IF EXISTS onboarding_leads CASCADE;
DROP TABLE IF EXISTS delivery_men CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS establishments CASCADE;
DROP TABLE IF EXISTS establishment_types CASCADE;
`;
