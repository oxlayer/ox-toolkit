/**
 * Database Schema for Alo Manager API
 *
 * Manages establishments, users, delivery men, service providers, and onboarding leads
 */

import { pgTable, text, timestamp, integer, boolean, jsonb, numeric } from 'drizzle-orm/pg-core';

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
  email: text('email'),
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
