/**
 * Database Schema for ox-globex-api
 *
 * This schema defines the data model for the Fator-H evaluation system,
 * following the oxlayer DDD architecture patterns.
 */

import { pgTable, uuid, varchar, timestamp, integer, text, decimal, jsonb, boolean, pgEnum, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// =============================================================================
// ENUMS
// =============================================================================

export const questionTypeEnum = pgEnum('question_type', ['text', 'audio']);
export const evaluationStatusEnum = pgEnum('evaluation_status', ['pending', 'in_progress', 'completed', 'partial', 'failed']);
export const completionStatusEnum = pgEnum('completion_status', ['completed', 'partial', 'failed']);

// =============================================================================
// WORKSPACES
// =============================================================================

/**
 * Workspaces Table
 *
 * Represents a tenant workspace in the Fator-H system.
 * Workspaces can be created at the organization level or directly at the realm level.
 */
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  organizationId: uuid('organization_id'), // Optional - can be null for realm-level workspaces
  // Provisioning fields for multi-tenancy
  realmId: varchar('realm_id', { length: 255 }), // Links to Keycloak realm (e.g., "company-name")
  databaseName: varchar('database_name', { length: 255 }), // Links to tenant database (e.g., "globex_workspace_realm_uuid")
  domainAliases: jsonb('domain_aliases').$type<string[]>(), // Custom domain aliases for this workspace
  rootManagerEmail: varchar('root_manager_email', { length: 255 }), // Root manager/owner email for this workspace
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  organizationIdx: index('idx_workspaces_organization_id').on(table.organizationId),
  realmIdIdx: index('idx_workspaces_realm_id').on(table.realmId),
  databaseNameIdx: index('idx_workspaces_database_name').on(table.databaseName),
}));

// =============================================================================
// EXAMS & QUESTIONS
// =============================================================================

/**
 * Exams Table
 *
 * Represents an evaluation exam within a workspace.
 * Each exam has multiple questions.
 */
export const exams = pgTable('exams', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  examName: varchar('exam_name', { length: 255 }).notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(30),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  workspaceIdx: index('idx_exams_workspace_id').on(table.workspaceId),
}));

/**
 * Questions Table
 *
 * Represents a question within an exam.
 * Questions can be text-based or audio-based.
 */
export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  examId: uuid('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  priority: integer('priority').notNull(),
  text: text('text').notNull(),
  type: questionTypeEnum('type').notNull(),
  weight: varchar('weight', { length: 50 }).notNull().default('medium'), // technical, behavioral, situational
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  examIdx: index('idx_questions_exam_id').on(table.examId),
}));

// =============================================================================
// CANDIDATES & ASSIGNMENTS
// =============================================================================

/**
 * Candidates Table
 *
 * Represents a candidate being evaluated.
 */
export const candidates = pgTable('candidates', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  cpf: varchar('cpf', { length: 11 }), // Brazilian tax ID
  externalId: varchar('external_id', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  workspaceIdx: index('idx_candidates_workspace_id').on(table.workspaceId),
  cpfIdx: index('idx_candidates_cpf').on(table.cpf),
  externalIdIdx: index('idx_candidates_external_id').on(table.externalId),
}));

/**
 * Exam Assignments Table
 *
 * Represents an exam assigned to a candidate.
 */
export const examAssignments = pgTable('exam_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  candidateId: uuid('candidate_id').notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  examId: uuid('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  status: evaluationStatusEnum('status').notNull().default('pending'),
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  candidateIdx: index('idx_exam_assignments_candidate_id').on(table.candidateId),
  examIdx: index('idx_exam_assignments_exam_id').on(table.examId),
  statusIdx: index('idx_exam_assignments_status').on(table.status),
}));

// =============================================================================
// ANSWERS & EVALUATIONS
// =============================================================================

/**
 * Answers Table
 *
 * Represents a candidate's answer to a question.
 * Stores the audio file reference for audio questions.
 */
export const answers = pgTable('answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  assignmentId: uuid('assignment_id').notNull().references(() => examAssignments.id, { onDelete: 'cascade' }),
  candidateId: uuid('candidate_id').notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  examId: uuid('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  s3Url: text('s3_url').notNull(), // S3 URL for audio file
  duration: decimal('duration', { precision: 10, scale: 2 }).notNull(), // Duration in seconds
  contentType: varchar('content_type', { length: 100 }).notNull(), // e.g., 'audio/mp3'
  fileSize: decimal('file_size', { precision: 15, scale: 2 }).notNull(), // File size in bytes
  isValid: boolean('is_valid').notNull().default(false),
  transcription: text('transcription'), // Transcribed text
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  assignmentIdx: index('idx_answers_assignment_id').on(table.assignmentId),
  candidateIdx: index('idx_answers_candidate_id').on(table.candidateId),
  examIdx: index('idx_answers_exam_id').on(table.examId),
  questionIdx: index('idx_answers_question_id').on(table.questionId),
}));

/**
 * Evaluation Results Table
 *
 * Represents the evaluation result for a candidate's exam.
 * Contains transcriptions, analysis results, and scores.
 */
export const evaluationResults = pgTable('evaluation_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  assignmentId: uuid('assignment_id').notNull().references(() => examAssignments.id, { onDelete: 'cascade' }),
  candidateId: uuid('candidate_id').notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  examId: uuid('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),

  // Analysis data stored as JSONB
  transcriptions: jsonb('transcriptions').notNull(), // Array of transcription results
  analysisResults: jsonb('analysis_results').notNull(), // Array of analysis results with scores

  // Summary metrics
  overallScore: decimal('overall_score', { precision: 5, scale: 2 }).notNull(),
  completionStatus: completionStatusEnum('completion_status').notNull(),
  failureReason: text('failure_reason'),

  // Processing metadata
  totalAnswers: integer('total_answers').notNull(),
  transcribedAnswers: integer('transcribed_answers').notNull(),
  analyzedAnswers: integer('analyzed_answers').notNull(),
  processingTimeMs: integer('processing_time_ms').notNull(),

  // Timestamps
  processedAt: timestamp('processed_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  assignmentIdx: index('idx_evaluation_results_assignment_id').on(table.assignmentId),
  candidateIdx: index('idx_evaluation_results_candidate_id').on(table.candidateId),
  examIdx: index('idx_evaluation_results_exam_id').on(table.examId),
}));

// =============================================================================
// WORKFLOWS & WEBHOOKS
// =============================================================================

/**
 * Workflow Executions Table
 *
 * Tracks the execution of evaluation workflows (transcription, analysis, etc.)
 */
export const workflowExecutions = pgTable('workflow_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  evaluationResultId: uuid('evaluation_result_id').notNull().references(() => evaluationResults.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull(), // 'running', 'completed', 'failed'
  stage: varchar('stage', { length: 50 }).notNull(), // 'transcription', 'analysis', 'scoring'
  error: text('error'),
  metadata: jsonb('metadata').notNull().default('{}'),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  evaluationResultIdx: index('idx_workflow_executions_evaluation_result_id').on(table.evaluationResultId),
  statusIdx: index('idx_workflow_executions_status').on(table.status),
}));

/**
 * Webhook Configurations Table
 *
 * Stores webhook configurations for external integrations.
 */
export const webhookConfigs = pgTable('webhook_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  events: jsonb('events').notNull(), // Array of events to subscribe to
  headers: jsonb('headers').notNull().default('{}'), // Custom headers
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  workspaceIdx: index('idx_webhook_configs_workspace_id').on(table.workspaceId),
}));

/**
 * Webhooks Table
 *
 * Tracks webhook delivery attempts.
 */
export const webhooks = pgTable('webhooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  webhookConfigId: uuid('webhook_config_id').notNull().references(() => webhookConfigs.id, { onDelete: 'cascade' }),
  event: varchar('event', { length: 100 }).notNull(),
  payload: jsonb('payload').notNull(),
  responseStatus: integer('response_status'),
  responseBody: text('response_body'),
  attemptedAt: timestamp('attempted_at').notNull().defaultNow(),
  succeeded: boolean('succeeded').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  webhookConfigIdx: index('idx_webhooks_webhook_config_id').on(table.webhookConfigId),
  eventIdx: index('idx_webhooks_event').on(table.event),
}));

// =============================================================================
// TAGS, TEMPLATES, CAMPAIGNS
// =============================================================================

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  key: varchar('key', { length: 100 }).notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  isPrimary: boolean('is_primary').notNull().default(false),
  description: text('description'),
  color: varchar('color', { length: 7 }), // Hex color code
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  workspaceIdx: index('idx_tags_workspace_id').on(table.workspaceId),
  keyIdx: index('idx_tags_key').on(table.key),
  uniqueTag: unique('unique_tag').on(table.workspaceId, table.key, table.value),
}));

export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'whatsapp', 'email', 'sms'
  subject: varchar('subject', { length: 255 }), // For email templates
  body: text('body').notNull(),
  variables: jsonb('variables').$type<string[]>(), // Array of variable names
  category: varchar('category', { length: 100 }),
  language: varchar('language', { length: 10 }).default('pt_BR'),
  isActive: boolean('is_active').notNull().default(true),
  externalId: varchar('external_id', { length: 255 }), // WhatsApp template ID
  status: varchar('status', { length: 50 }).default('draft'), // draft, pending, approved, rejected
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  workspaceIdx: index('idx_templates_workspace_id').on(table.workspaceId),
  typeIdx: index('idx_templates_type').on(table.type),
}));

export const templateMedia = pgTable('template_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => templates.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // 'image', 'video', 'document'
  url: text('url').notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  size: integer('size'), // Size in bytes
  caption: text('caption'),
  fileName: varchar('file_name', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  templateIdx: index('idx_template_media_template_id').on(table.templateId),
}));

export const templateButtons = pgTable('template_buttons', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => templates.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // 'quickReply', 'url', 'call'
  text: varchar('text', { length: 255 }).notNull(),
  url: text('url'), // For URL buttons
  phoneNumber: varchar('phone_number', { length: 50 }), // For call buttons
  index: integer('index').notNull(), // Button order
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  templateIdx: index('idx_template_buttons_template_id').on(table.templateId),
}));

export const whatsappCampaigns = pgTable('whatsapp_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  examId: uuid('exam_id').references(() => exams.id, { onDelete: 'set null' }),
  templateId: uuid('template_id').notNull().references(() => templates.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('draft'), // draft, scheduled, sending, sent, failed, cancelled
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  totalRecipients: integer('total_recipients').default(0),
  sentCount: integer('sent_count').default(0),
  deliveredCount: integer('delivered_count').default(0),
  failedCount: integer('failed_count').default(0),
  tags: jsonb('tags').$type<string[]>(), // Array of tag keys for filtering
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  workspaceIdx: index('idx_whatsapp_campaigns_workspace_id').on(table.workspaceId),
  examIdx: index('idx_whatsapp_campaigns_exam_id').on(table.examId),
  templateIdx: index('idx_whatsapp_campaigns_template_id').on(table.templateId),
  statusIdx: index('idx_whatsapp_campaigns_status').on(table.status),
}));

export const whatsappCampaignRecipients = pgTable('whatsapp_campaign_recipients', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => whatsappCampaigns.id, { onDelete: 'cascade' }),
  candidateId: uuid('candidate_id').notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  phoneNumber: varchar('phone_number', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, sent, delivered, read, failed
  variables: jsonb('variables').$type<Record<string, string>>(), // Variables for template personalization
  errorMessage: text('error_message'),
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  campaignIdx: index('idx_whatsapp_campaign_recipients_campaign_id').on(table.campaignId),
  candidateIdx: index('idx_whatsapp_campaign_recipients_candidate_id').on(table.candidateId),
  statusIdx: index('idx_whatsapp_campaign_recipients_status').on(table.status),
  uniqueRecipient: unique('unique_campaign_recipient').on(table.campaignId, table.candidateId),
}));

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;

export type Exam = typeof exams.$inferSelect;
export type NewExam = typeof exams.$inferInsert;

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;

export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;

export type ExamAssignment = typeof examAssignments.$inferSelect;
export type NewExamAssignment = typeof examAssignments.$inferInsert;

export type Answer = typeof answers.$inferSelect;
export type NewAnswer = typeof answers.$inferInsert;

export type EvaluationResult = typeof evaluationResults.$inferSelect;
export type NewEvaluationResult = typeof evaluationResults.$inferInsert;

export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type NewWorkflowExecution = typeof workflowExecutions.$inferInsert;

export type WebhookConfig = typeof webhookConfigs.$inferSelect;
export type NewWebhookConfig = typeof webhookConfigs.$inferInsert;

export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;

export type TemplateMedia = typeof templateMedia.$inferSelect;
export type NewTemplateMedia = typeof templateMedia.$inferInsert;

export type TemplateButton = typeof templateButtons.$inferSelect;
export type NewTemplateButton = typeof templateButtons.$inferInsert;

export type WhatsAppCampaign = typeof whatsappCampaigns.$inferSelect;
export type NewWhatsAppCampaign = typeof whatsappCampaigns.$inferInsert;

export type WhatsAppCampaignRecipient = typeof whatsappCampaignRecipients.$inferSelect;
export type NewWhatsAppCampaignRecipient = typeof whatsappCampaignRecipients.$inferInsert;

/**
 * Migration SQL (string version for auto-migration)
 *
 * This is used by the postgres adapter's auto-migration feature.
 * Contains all tables for the globex application.
 */
export const createTableSQLString = `
-- Enums
DO $$ BEGIN
  CREATE TYPE question_type AS ENUM ('text', 'audio');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE evaluation_status AS ENUM ('pending', 'in_progress', 'completed', 'partial', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE completion_status AS ENUM ('completed', 'partial', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  organization_id UUID, -- Nullable - workspaces can be at realm level
  -- Provisioning fields for multi-tenancy
  realm_id VARCHAR(255),
  database_name VARCHAR(255),
  domain_aliases JSONB,
  root_manager_email VARCHAR(255),
  deleted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add missing columns for multi-tenancy (for existing tables)
DO $$
BEGIN
  -- Make organization_id nullable if it's NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspaces' AND column_name = 'organization_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE workspaces ALTER COLUMN organization_id DROP NOT NULL;
  END IF;

  -- Add realm_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspaces' AND column_name = 'realm_id'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN realm_id VARCHAR(255);
  END IF;

  -- Add database_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspaces' AND column_name = 'database_name'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN database_name VARCHAR(255);
  END IF;

  -- Add domain_aliases if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspaces' AND column_name = 'domain_aliases'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN domain_aliases JSONB;
  END IF;

  -- Add root_manager_email if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspaces' AND column_name = 'root_manager_email'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN root_manager_email VARCHAR(255);
  END IF;
END $$;

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  exam_name VARCHAR(255) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Drop program_id column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exams' AND column_name = 'program_id'
  ) THEN
    ALTER TABLE exams DROP COLUMN program_id;
  END IF;
END $$;

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL,
  text TEXT NOT NULL,
  type question_type NOT NULL,
  weight VARCHAR(50) NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add weight column to existing questions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'weight'
  ) THEN
    ALTER TABLE questions ADD COLUMN weight VARCHAR(50) NOT NULL DEFAULT 'medium';
  END IF;
END $$;

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  cpf VARCHAR(11),
  external_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Exam Assignments table
CREATE TABLE IF NOT EXISTS exam_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  status evaluation_status NOT NULL DEFAULT 'pending',
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES exam_assignments(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  s3_url TEXT NOT NULL,
  duration DECIMAL(10, 2) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  file_size DECIMAL(15, 2) NOT NULL,
  is_valid BOOLEAN NOT NULL DEFAULT FALSE,
  transcription TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Evaluation Results table
CREATE TABLE IF NOT EXISTS evaluation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES exam_assignments(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  transcriptions JSONB NOT NULL,
  analysis_results JSONB NOT NULL,
  overall_score DECIMAL(5, 2) NOT NULL,
  completion_status completion_status NOT NULL,
  failure_reason TEXT,
  total_answers INTEGER NOT NULL,
  transcribed_answers INTEGER NOT NULL,
  analyzed_answers INTEGER NOT NULL,
  processing_time_ms INTEGER NOT NULL,
  processed_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Workflow Executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_result_id UUID NOT NULL REFERENCES evaluation_results(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  stage VARCHAR(50) NOT NULL,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Webhook Configurations table
CREATE TABLE IF NOT EXISTS webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events JSONB NOT NULL,
  headers JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_config_id UUID NOT NULL REFERENCES webhook_configs(id) ON DELETE CASCADE,
  event VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  succeeded BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL,
  value VARCHAR(255) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  color VARCHAR(7),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, key, value)
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  body TEXT NOT NULL,
  variables JSONB,
  category VARCHAR(100),
  language VARCHAR(10) DEFAULT 'pt_BR',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  external_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Template Media table
CREATE TABLE IF NOT EXISTS template_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  mime_type VARCHAR(100),
  size INTEGER,
  caption TEXT,
  file_name VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Template Buttons table
CREATE TABLE IF NOT EXISTS template_buttons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  text VARCHAR(255) NOT NULL,
  url TEXT,
  phone_number VARCHAR(50),
  "index" INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- WhatsApp Campaigns table
CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE SET NULL,
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  tags JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Drop program_id column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_campaigns' AND column_name = 'program_id'
  ) THEN
    ALTER TABLE whatsapp_campaigns DROP COLUMN program_id;
  END IF;
END $$;

-- WhatsApp Campaign Recipients table
CREATE TABLE IF NOT EXISTS whatsapp_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES whatsapp_campaigns(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  phone_number VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  variables JSONB,
  error_message TEXT,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, candidate_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_organization_id ON workspaces(organization_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_realm_id ON workspaces(realm_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_database_name ON workspaces(database_name);
CREATE INDEX IF NOT EXISTS idx_exams_workspace_id ON exams(workspace_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_candidates_workspace_id ON candidates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_candidates_cpf ON candidates(cpf);
CREATE INDEX IF NOT EXISTS idx_candidates_external_id ON candidates(external_id);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_candidate_id ON exam_assignments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_exam_id ON exam_assignments(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_status ON exam_assignments(status);
CREATE INDEX IF NOT EXISTS idx_answers_assignment_id ON answers(assignment_id);
CREATE INDEX IF NOT EXISTS idx_answers_candidate_id ON answers(candidate_id);
CREATE INDEX IF NOT EXISTS idx_answers_exam_id ON answers(exam_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_results_assignment_id ON evaluation_results(assignment_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_results_candidate_id ON evaluation_results(candidate_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_results_exam_id ON evaluation_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_evaluation_result_id ON workflow_executions(evaluation_result_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_workspace_id ON webhook_configs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_webhook_config_id ON webhooks(webhook_config_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_event ON webhooks(event);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_tags_workspace_id ON tags(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tags_key ON tags(key);

CREATE INDEX IF NOT EXISTS idx_templates_workspace_id ON templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);

CREATE INDEX IF NOT EXISTS idx_template_media_template_id ON template_media(template_id);

CREATE INDEX IF NOT EXISTS idx_template_buttons_template_id ON template_buttons(template_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_workspace_id ON whatsapp_campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_exam_id ON whatsapp_campaigns(exam_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_template_id ON whatsapp_campaigns(template_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_status ON whatsapp_campaigns(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_campaign_recipients_campaign_id ON whatsapp_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaign_recipients_candidate_id ON whatsapp_campaign_recipients(candidate_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaign_recipients_status ON whatsapp_campaign_recipients(status);

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

DROP TRIGGER IF EXISTS update_exams_updated_at ON exams;
CREATE TRIGGER update_exams_updated_at
  BEFORE UPDATE ON exams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidates_updated_at ON candidates;
CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_assignments_updated_at ON exam_assignments;
CREATE TRIGGER update_exam_assignments_updated_at
  BEFORE UPDATE ON exam_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_answers_updated_at ON answers;
CREATE TRIGGER update_answers_updated_at
  BEFORE UPDATE ON answers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_evaluation_results_updated_at ON evaluation_results;
CREATE TRIGGER update_evaluation_results_updated_at
  BEFORE UPDATE ON evaluation_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_executions_updated_at ON workflow_executions;
CREATE TRIGGER update_workflow_executions_updated_at
  BEFORE UPDATE ON workflow_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_webhook_configs_updated_at ON webhook_configs;
CREATE TRIGGER update_webhook_configs_updated_at
  BEFORE UPDATE ON webhook_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tags_updated_at ON tags;
CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_whatsapp_campaigns_updated_at ON whatsapp_campaigns;
CREATE TRIGGER update_whatsapp_campaigns_updated_at
  BEFORE UPDATE ON whatsapp_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_whatsapp_campaign_recipients_updated_at ON whatsapp_campaign_recipients;
CREATE TRIGGER update_whatsapp_campaign_recipients_updated_at
  BEFORE UPDATE ON whatsapp_campaign_recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;
