/**
 * Database Schema
 */

import { pgTable, text, timestamp, integer, boolean, jsonb, date } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Workspaces Table
 *
 * Core organizing unit - each workspace has a type (personal, crm, recruiting)
 * which determines which features are available via feature flags.
 */
export const Workspace = pgTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['personal', 'crm', 'recruiting'] }).notNull(),
  ownerId: text('owner_id').notNull(),
  flags: jsonb('flags').notNull().default('{}'),
  // flags structure: { "features": { "contacts": true, "deals": false, "pipeline": true } }
  settings: jsonb('settings').notNull().default('{}'),
  // settings: { "defaultView": "kanban", "currency": "USD" }
  icon: text('icon'),
  color: text('color'),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Contacts Table (CRM)
 *
 * External people (not system users) for CRM workspace type
 */
export const Contact = pgTable('contacts', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => Workspace.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  status: text('status', { enum: ['active', 'inactive', 'blocked'] }).notNull().default('active'),
  source: text('source').notNull().default('manual'),
  metadata: jsonb('metadata').notNull().default('{}'),
  lastContactedAt: timestamp('last_contacted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Companies Table (CRM)
 *
 * Organizations for CRM workspace type
 */
export const Company = pgTable('companies', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => Workspace.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  domain: text('domain'),
  industry: text('industry'),
  size: text('size'),
  website: text('website'),
  logoUrl: text('logo_url'),
  status: text('status', { enum: ['prospect', 'customer', 'partner', 'churned'] }).notNull().default('prospect'),
  metadata: jsonb('metadata').notNull().default('{}'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Deals Table (CRM)
 *
 * Sales opportunities with stage and value tracking
 */
export const Deal = pgTable('deals', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => Workspace.id, { onDelete: 'cascade' }),
  contactId: text('contact_id').references(() => Contact.id, { onDelete: 'set null' }),
  companyId: text('company_id').references(() => Company.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  value: integer('value'), // Stored as cents (integer) to avoid floating point issues
  currency: text('currency').notNull().default('USD'),
  stage: text('stage').notNull(),
  probability: integer('probability'),
  expectedCloseDate: date('expected_close_date'),
  actualCloseDate: date('actual_close_date'),
  status: text('status', { enum: ['open', 'won', 'lost', 'abandoned'] }).notNull().default('open'),
  metadata: jsonb('metadata').notNull().default('{}'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Candidates Table (Recruiting)
 *
 * Job applicants for recruiting workspace type
 */
export const Candidate = pgTable('candidates', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => Workspace.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  resumeUrl: text('resume_url'),
  linkedinUrl: text('linkedin_url'),
  portfolioUrl: text('portfolio_url'),
  status: text('status', { enum: ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'] }).notNull().default('applied'),
  source: text('source').notNull().default('manual'),
  metadata: jsonb('metadata').notNull().default('{}'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Positions Table (Recruiting)
 *
 * Open job positions for recruiting workspace type
 */
export const Position = pgTable('positions', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => Workspace.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  department: text('department'),
  location: text('location'),
  type: text('type', { enum: ['full-time', 'part-time', 'contract', 'intern'] }),
  status: text('status', { enum: ['draft', 'open', 'paused', 'closed'] }).notNull().default('open'),
  description: text('description'),
  requirements: jsonb('requirements').notNull().default('[]'),
  metadata: jsonb('metadata').notNull().default('{}'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Pipeline Stages Table
 *
 * Configurable pipeline stages for deals and candidates
 */
export const PipelineStage = pgTable('pipeline_stages', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => Workspace.id, { onDelete: 'cascade' }),
  pipelineType: text('pipeline_type', { enum: ['deals', 'candidates'] }).notNull(),
  name: text('name').notNull(),
  orderIndex: integer('order_index').notNull(),
  color: text('color'),
  probability: integer('probability'),
  metadata: jsonb('metadata').notNull().default('{}'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Projects Table
 *
 * Organizational units for grouping todos
 */
export const Project = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color'),
  icon: text('icon'),
  isInbox: boolean('is_inbox').notNull().default(false),
  order: integer('order').notNull().default(0),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Sections Table
 *
 * Sub-groups within projects
 */
export const Section = pgTable('sections', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => Project.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Todos Table
 *
 * Single-tenant B2C table with:
 * - user_id for user ownership
 * - workspace_id for workspace organization
 * - project_id and section_id for organization
 * - context_type and context_id for optional CRM linking
 * - status for workflow state
 * - priority for task importance
 * - recurrence for recurring tasks
 */
export const Todo = pgTable('todos', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', {
    enum: ['pending', 'in_progress', 'completed'],
  }).notNull().default('pending'),
  priority: integer('priority').notNull().default(4),
  projectId: text('project_id').references(() => Project.id, { onDelete: 'set null' }),
  sectionId: text('section_id').references(() => Section.id, { onDelete: 'set null' }),
  userId: text('user_id').notNull(),
  workspaceId: text('workspace_id').notNull().references(() => Workspace.id, { onDelete: 'cascade' }),
  // Optional CRM context - links task to a CRM entity
  contextType: text('context_type', { enum: ['contact', 'company', 'deal', 'candidate', 'position'] }),
  contextId: text('context_id'),
  // Recurrence rule for recurring tasks
  recurrence: jsonb('recurrence'),
  // recurrence: { "frequency": "weekly", "interval": 1, "until": "2026-12-31" }
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  order: integer('order'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Type exports
 */
export type Workspace = typeof Workspace.$inferSelect;
export type NewWorkspace = typeof Workspace.$inferInsert;

export type Contact = typeof Contact.$inferSelect;
export type NewContact = typeof Contact.$inferInsert;

export type Company = typeof Company.$inferSelect;
export type NewCompany = typeof Company.$inferInsert;

export type Deal = typeof Deal.$inferSelect;
export type NewDeal = typeof Deal.$inferInsert;

export type Candidate = typeof Candidate.$inferSelect;
export type NewCandidate = typeof Candidate.$inferInsert;

export type Position = typeof Position.$inferSelect;
export type NewPosition = typeof Position.$inferInsert;

export type PipelineStage = typeof PipelineStage.$inferSelect;
export type NewPipelineStage = typeof PipelineStage.$inferInsert;

export type Todo = typeof Todo.$inferSelect;
export type NewTodo = typeof Todo.$inferInsert;

export type Project = typeof Project.$inferSelect;
export type NewProject = typeof Project.$inferInsert;

export type Section = typeof Section.$inferSelect;
export type NewSection = typeof Section.$inferInsert;

/**
 * Migration SQL (string version for auto-migration)
 *
 * This is used by the postgres adapter's auto-migration feature.
 * Contains all tables for the Legend todo app.
 */
export const createTableSQLString = `
-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('personal', 'crm', 'recruiting')),
  owner_id TEXT NOT NULL,
  flags JSONB NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}',
  icon TEXT,
  color TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Contacts table (CRM)
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  source TEXT NOT NULL DEFAULT 'manual',
  metadata JSONB NOT NULL DEFAULT '{}',
  last_contacted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Companies table (CRM)
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT,
  website TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect', 'customer', 'partner', 'churned')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Deals table (CRM)
CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  value INTEGER,
  currency TEXT NOT NULL DEFAULT 'USD',
  stage TEXT NOT NULL,
  probability INTEGER,
  expected_close_date DATE,
  actual_close_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'abandoned')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Candidates table (Recruiting)
CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  resume_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected')),
  source TEXT NOT NULL DEFAULT 'manual',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Positions table (Recruiting)
CREATE TABLE IF NOT EXISTS positions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  type TEXT CHECK (type IN ('full-time', 'part-time', 'contract', 'intern')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'paused', 'closed')),
  description TEXT,
  requirements JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Pipeline stages table
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  pipeline_type TEXT NOT NULL CHECK (pipeline_type IN ('deals', 'candidates')),
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  color TEXT,
  probability INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  is_inbox BOOLEAN NOT NULL DEFAULT FALSE,
  "order" INTEGER NOT NULL DEFAULT 0,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sections table
CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Todos table
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority INTEGER NOT NULL DEFAULT 4 CHECK (priority IN (1, 2, 3, 4)),
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  section_id TEXT REFERENCES sections(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  context_type TEXT CHECK (context_type IN ('contact', 'company', 'deal', 'candidate', 'position')),
  context_id TEXT,
  recurrence JSONB,
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  "order" INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_type ON workspaces(type);
CREATE INDEX IF NOT EXISTS idx_contacts_workspace_id ON contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_companies_workspace_id ON companies(workspace_id);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_deals_workspace_id ON deals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_candidates_workspace_id ON candidates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_positions_workspace_id ON positions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_workspace_id ON pipeline_stages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_order ON projects("order");
CREATE INDEX IF NOT EXISTS idx_sections_project_id ON sections(project_id);
CREATE INDEX IF NOT EXISTS idx_sections_order ON sections("order");
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_workspace_id ON todos(workspace_id);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_project_id ON todos(project_id);
CREATE INDEX IF NOT EXISTS idx_todos_section_id ON todos(section_id);
CREATE INDEX IF NOT EXISTS idx_todos_context ON todos(context_type, context_id) WHERE context_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidates_updated_at ON candidates;
CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_positions_updated_at ON positions;
CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pipeline_stages_updated_at ON pipeline_stages;
CREATE TRIGGER update_pipeline_stages_updated_at
  BEFORE UPDATE ON pipeline_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sections_updated_at ON sections;
CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_todos_updated_at ON todos;
CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

export const createTableSQL = sql`
-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('personal', 'crm', 'recruiting')),
  owner_id TEXT NOT NULL,
  flags JSONB NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}',
  icon TEXT,
  color TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Contacts table (CRM)
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  source TEXT NOT NULL DEFAULT 'manual',
  metadata JSONB NOT NULL DEFAULT '{}',
  last_contacted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Companies table (CRM)
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT,
  website TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect', 'customer', 'partner', 'churned')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Deals table (CRM)
CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  value INTEGER,
  currency TEXT NOT NULL DEFAULT 'USD',
  stage TEXT NOT NULL,
  probability INTEGER,
  expected_close_date DATE,
  actual_close_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'abandoned')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Candidates table (Recruiting)
CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  resume_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected')),
  source TEXT NOT NULL DEFAULT 'manual',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Positions table (Recruiting)
CREATE TABLE IF NOT EXISTS positions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  type TEXT CHECK (type IN ('full-time', 'part-time', 'contract', 'intern')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'paused', 'closed')),
  description TEXT,
  requirements JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Pipeline stages table
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  pipeline_type TEXT NOT NULL CHECK (pipeline_type IN ('deals', 'candidates')),
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  color TEXT,
  probability INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  is_inbox BOOLEAN NOT NULL DEFAULT FALSE,
  order INTEGER NOT NULL DEFAULT 0,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sections table
CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Todos table
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority INTEGER NOT NULL DEFAULT 4 CHECK (priority IN (1, 2, 3, 4)),
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  section_id TEXT REFERENCES sections(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  context_type TEXT CHECK (context_type IN ('contact', 'company', 'deal', 'candidate', 'position')),
  context_id TEXT,
  recurrence JSONB,
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  order INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_type ON workspaces(type);
CREATE INDEX IF NOT EXISTS idx_contacts_workspace_id ON contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_companies_workspace_id ON companies(workspace_id);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_deals_workspace_id ON deals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_candidates_workspace_id ON candidates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_positions_workspace_id ON positions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_workspace_id ON pipeline_stages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_order ON projects(order);
CREATE INDEX IF NOT EXISTS idx_sections_project_id ON sections(project_id);
CREATE INDEX IF NOT EXISTS idx_sections_order ON sections(order);
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_workspace_id ON todos(workspace_id);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_project_id ON todos(project_id);
CREATE INDEX IF NOT EXISTS idx_todos_section_id ON todos(section_id);
CREATE INDEX IF NOT EXISTS idx_todos_context ON todos(context_type, context_id) WHERE context_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidates_updated_at ON candidates;
CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_positions_updated_at ON positions;
CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pipeline_stages_updated_at ON pipeline_stages;
CREATE TRIGGER update_pipeline_stages_updated_at
  BEFORE UPDATE ON pipeline_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sections_updated_at ON sections;
CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_todos_updated_at ON todos;
CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

/**
 * Drop Table SQL
 */
export const dropTableSQL = sql`
DROP TABLE IF EXISTS pipeline_stages CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS todos CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
`;
