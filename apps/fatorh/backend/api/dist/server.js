var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc6) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc6 = __getOwnPropDesc(from, key)) || desc6.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/config/app.config.ts
import { z } from "zod";
function loadEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error("\u274C Invalid environment configuration:");
    if (error instanceof z.ZodError) {
      for (const err of error.issues) {
        const path = err.path.join(".");
        console.error(`  - ${path}: ${err.message}`);
      }
    } else {
      console.error("  Unknown error:", error);
    }
    process.exit(1);
  }
}
var envSchema, ENV;
var init_app_config = __esm({
  "src/config/app.config.ts"() {
    "use strict";
    envSchema = z.object({
      // Server
      PORT: z.string().default("3001"),
      HOST: z.string().default("0.0.0.0"),
      // Service
      SERVICE_NAME: z.string().default("globex-api"),
      SERVICE_VERSION: z.string().default("1.0.0"),
      // Authentication
      JWT_SECRET: z.string(),
      // Keycloak Authentication
      KEYCLOAK_ENABLED: z.string().transform((v) => v === "true"),
      KEYCLOAK_SERVER_URL: z.string().url(),
      KEYCLOAK_REALM: z.string(),
      KEYCLOAK_CLIENT_ID: z.string(),
      // PostgreSQL
      POSTGRES_HOST: z.string(),
      POSTGRES_PORT: z.coerce.number(),
      POSTGRES_DATABASE: z.string(),
      POSTGRES_USER: z.string(),
      POSTGRES_PASSWORD: z.string(),
      // PostgreSQL Admin (Control Panel Database)
      POSTGRES_ADMIN_HOST: z.string(),
      POSTGRES_ADMIN_PORT: z.coerce.number(),
      POSTGRES_ADMIN_DATABASE: z.string(),
      POSTGRES_ADMIN_USER: z.string(),
      POSTGRES_ADMIN_PASSWORD: z.string(),
      // Redis Cache
      REDIS_HOST: z.string(),
      REDIS_PORT: z.coerce.number(),
      REDIS_PASSWORD: z.string().optional(),
      REDIS_DB: z.coerce.number(),
      // RabbitMQ
      RABBITMQ_HOST: z.string(),
      RABBITMQ_PORT: z.coerce.number(),
      RABBITMQ_USERNAME: z.string(),
      RABBITMQ_PASSWORD: z.string(),
      RABBITMQ_VHOST: z.string(),
      RABBITMQ_QUEUE: z.string(),
      // Bitwarden Secrets (for multi-tenancy credentials)
      BITWARDEN_ENABLED: z.string().transform((v) => v === "true"),
      BITWARDEN_TOKEN: z.string().optional(),
      BITWARDEN_URL: z.string(),
      // App
      NODE_ENV: z.enum(["development", "production", "test"])
    });
    ENV = loadEnv();
  }
});

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  answers: () => answers,
  candidates: () => candidates,
  completionStatusEnum: () => completionStatusEnum,
  createTableSQLString: () => createTableSQLString,
  evaluationResults: () => evaluationResults,
  evaluationStatusEnum: () => evaluationStatusEnum,
  examAssignments: () => examAssignments,
  exams: () => exams,
  questionTypeEnum: () => questionTypeEnum,
  questions: () => questions,
  tags: () => tags,
  templateButtons: () => templateButtons,
  templateMedia: () => templateMedia,
  templates: () => templates,
  webhookConfigs: () => webhookConfigs,
  webhooks: () => webhooks,
  whatsappCampaignRecipients: () => whatsappCampaignRecipients,
  whatsappCampaigns: () => whatsappCampaigns,
  workflowExecutions: () => workflowExecutions,
  workspaces: () => workspaces
});
import { pgTable, uuid, varchar, timestamp, integer, text, decimal, jsonb, boolean, pgEnum, index } from "drizzle-orm/pg-core";
var questionTypeEnum, evaluationStatusEnum, completionStatusEnum, workspaces, exams, questions, candidates, examAssignments, answers, evaluationResults, workflowExecutions, webhookConfigs, webhooks, tags, templates, templateMedia, templateButtons, whatsappCampaigns, whatsappCampaignRecipients, createTableSQLString;
var init_schema = __esm({
  "src/db/schema.ts"() {
    "use strict";
    questionTypeEnum = pgEnum("question_type", ["text", "audio"]);
    evaluationStatusEnum = pgEnum("evaluation_status", ["pending", "in_progress", "completed", "partial", "failed"]);
    completionStatusEnum = pgEnum("completion_status", ["completed", "partial", "failed"]);
    workspaces = pgTable("workspaces", {
      id: uuid("id").primaryKey().defaultRandom(),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      organizationId: uuid("organization_id"),
      // Optional - can be null for realm-level workspaces
      // Provisioning fields for multi-tenancy
      realmId: varchar("realm_id", { length: 255 }),
      // Links to Keycloak realm (e.g., "company-name")
      databaseName: varchar("database_name", { length: 255 }),
      // Links to tenant database (e.g., "globex_workspace_realm_uuid")
      domainAliases: jsonb("domain_aliases").$type(),
      // Custom domain aliases for this workspace
      rootManagerEmail: varchar("root_manager_email", { length: 255 }),
      // Root manager/owner email for this workspace
      deletedAt: timestamp("deleted_at"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      organizationIdx: index("idx_workspaces_organization_id").on(table.organizationId),
      realmIdIdx: index("idx_workspaces_realm_id").on(table.realmId),
      databaseNameIdx: index("idx_workspaces_database_name").on(table.databaseName)
    }));
    exams = pgTable("exams", {
      id: uuid("id").primaryKey().defaultRandom(),
      workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
      examName: varchar("exam_name", { length: 255 }).notNull(),
      durationMinutes: integer("duration_minutes").notNull().default(30),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      workspaceIdx: index("idx_exams_workspace_id").on(table.workspaceId)
    }));
    questions = pgTable("questions", {
      id: uuid("id").primaryKey().defaultRandom(),
      examId: uuid("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
      priority: integer("priority").notNull(),
      text: text("text").notNull(),
      type: questionTypeEnum("type").notNull(),
      weight: varchar("weight", { length: 50 }).notNull().default("medium"),
      // technical, behavioral, situational
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      examIdx: index("idx_questions_exam_id").on(table.examId)
    }));
    candidates = pgTable("candidates", {
      id: uuid("id").primaryKey().defaultRandom(),
      workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
      name: varchar("name", { length: 255 }).notNull(),
      email: varchar("email", { length: 255 }),
      cpf: varchar("cpf", { length: 11 }),
      // Brazilian tax ID
      externalId: varchar("external_id", { length: 255 }),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      workspaceIdx: index("idx_candidates_workspace_id").on(table.workspaceId),
      cpfIdx: index("idx_candidates_cpf").on(table.cpf),
      externalIdIdx: index("idx_candidates_external_id").on(table.externalId)
    }));
    examAssignments = pgTable("exam_assignments", {
      id: uuid("id").primaryKey().defaultRandom(),
      candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
      examId: uuid("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
      status: evaluationStatusEnum("status").notNull().default("pending"),
      assignedAt: timestamp("assigned_at").notNull().defaultNow(),
      completedAt: timestamp("completed_at"),
      expiresAt: timestamp("expires_at"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      candidateIdx: index("idx_exam_assignments_candidate_id").on(table.candidateId),
      examIdx: index("idx_exam_assignments_exam_id").on(table.examId),
      statusIdx: index("idx_exam_assignments_status").on(table.status)
    }));
    answers = pgTable("answers", {
      id: uuid("id").primaryKey().defaultRandom(),
      assignmentId: uuid("assignment_id").notNull().references(() => examAssignments.id, { onDelete: "cascade" }),
      candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
      examId: uuid("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
      questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
      s3Url: text("s3_url").notNull(),
      // S3 URL for audio file
      duration: decimal("duration", { precision: 10, scale: 2 }).notNull(),
      // Duration in seconds
      contentType: varchar("content_type", { length: 100 }).notNull(),
      // e.g., 'audio/mp3'
      fileSize: decimal("file_size", { precision: 15, scale: 2 }).notNull(),
      // File size in bytes
      isValid: boolean("is_valid").notNull().default(false),
      transcription: text("transcription"),
      // Transcribed text
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      assignmentIdx: index("idx_answers_assignment_id").on(table.assignmentId),
      candidateIdx: index("idx_answers_candidate_id").on(table.candidateId),
      examIdx: index("idx_answers_exam_id").on(table.examId),
      questionIdx: index("idx_answers_question_id").on(table.questionId)
    }));
    evaluationResults = pgTable("evaluation_results", {
      id: uuid("id").primaryKey().defaultRandom(),
      assignmentId: uuid("assignment_id").notNull().references(() => examAssignments.id, { onDelete: "cascade" }),
      candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
      examId: uuid("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
      // Analysis data stored as JSONB
      transcriptions: jsonb("transcriptions").notNull(),
      // Array of transcription results
      analysisResults: jsonb("analysis_results").notNull(),
      // Array of analysis results with scores
      // Summary metrics
      overallScore: decimal("overall_score", { precision: 5, scale: 2 }).notNull(),
      completionStatus: completionStatusEnum("completion_status").notNull(),
      failureReason: text("failure_reason"),
      // Processing metadata
      totalAnswers: integer("total_answers").notNull(),
      transcribedAnswers: integer("transcribed_answers").notNull(),
      analyzedAnswers: integer("analyzed_answers").notNull(),
      processingTimeMs: integer("processing_time_ms").notNull(),
      // Timestamps
      processedAt: timestamp("processed_at").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      assignmentIdx: index("idx_evaluation_results_assignment_id").on(table.assignmentId),
      candidateIdx: index("idx_evaluation_results_candidate_id").on(table.candidateId),
      examIdx: index("idx_evaluation_results_exam_id").on(table.examId)
    }));
    workflowExecutions = pgTable("workflow_executions", {
      id: uuid("id").primaryKey().defaultRandom(),
      evaluationResultId: uuid("evaluation_result_id").notNull().references(() => evaluationResults.id, { onDelete: "cascade" }),
      status: varchar("status", { length: 50 }).notNull(),
      // 'running', 'completed', 'failed'
      stage: varchar("stage", { length: 50 }).notNull(),
      // 'transcription', 'analysis', 'scoring'
      error: text("error"),
      metadata: jsonb("metadata").notNull().default("{}"),
      startedAt: timestamp("started_at").notNull().defaultNow(),
      completedAt: timestamp("completed_at"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      evaluationResultIdx: index("idx_workflow_executions_evaluation_result_id").on(table.evaluationResultId),
      statusIdx: index("idx_workflow_executions_status").on(table.status)
    }));
    webhookConfigs = pgTable("webhook_configs", {
      id: uuid("id").primaryKey().defaultRandom(),
      workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
      url: text("url").notNull(),
      events: jsonb("events").notNull(),
      // Array of events to subscribe to
      headers: jsonb("headers").notNull().default("{}"),
      // Custom headers
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      workspaceIdx: index("idx_webhook_configs_workspace_id").on(table.workspaceId)
    }));
    webhooks = pgTable("webhooks", {
      id: uuid("id").primaryKey().defaultRandom(),
      webhookConfigId: uuid("webhook_config_id").notNull().references(() => webhookConfigs.id, { onDelete: "cascade" }),
      event: varchar("event", { length: 100 }).notNull(),
      payload: jsonb("payload").notNull(),
      responseStatus: integer("response_status"),
      responseBody: text("response_body"),
      attemptedAt: timestamp("attempted_at").notNull().defaultNow(),
      succeeded: boolean("succeeded").notNull().default(false),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      webhookConfigIdx: index("idx_webhooks_webhook_config_id").on(table.webhookConfigId),
      eventIdx: index("idx_webhooks_event").on(table.event)
    }));
    tags = pgTable("tags", {
      id: uuid("id").primaryKey().defaultRandom(),
      workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
      key: varchar("key", { length: 100 }).notNull(),
      value: varchar("value", { length: 255 }).notNull(),
      isPrimary: boolean("is_primary").notNull().default(false),
      description: text("description"),
      color: varchar("color", { length: 7 }),
      // Hex color code
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      workspaceIdx: index("idx_tags_workspace_id").on(table.workspaceId),
      keyIdx: index("idx_tags_key").on(table.key),
      uniqueTag: unique("unique_tag").on(table.workspaceId, table.key, table.value)
    }));
    templates = pgTable("templates", {
      id: uuid("id").primaryKey().defaultRandom(),
      workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
      name: varchar("name", { length: 255 }).notNull(),
      type: varchar("type", { length: 50 }).notNull(),
      // 'whatsapp', 'email', 'sms'
      subject: varchar("subject", { length: 255 }),
      // For email templates
      body: text("body").notNull(),
      variables: jsonb("variables").$type(),
      // Array of variable names
      category: varchar("category", { length: 100 }),
      language: varchar("language", { length: 10 }).default("pt_BR"),
      isActive: boolean("is_active").notNull().default(true),
      externalId: varchar("external_id", { length: 255 }),
      // WhatsApp template ID
      status: varchar("status", { length: 50 }).default("draft"),
      // draft, pending, approved, rejected
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      workspaceIdx: index("idx_templates_workspace_id").on(table.workspaceId),
      typeIdx: index("idx_templates_type").on(table.type)
    }));
    templateMedia = pgTable("template_media", {
      id: uuid("id").primaryKey().defaultRandom(),
      templateId: uuid("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
      type: varchar("type", { length: 50 }).notNull(),
      // 'image', 'video', 'document'
      url: text("url").notNull(),
      mimeType: varchar("mime_type", { length: 100 }),
      size: integer("size"),
      // Size in bytes
      caption: text("caption"),
      fileName: varchar("file_name", { length: 255 }),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      templateIdx: index("idx_template_media_template_id").on(table.templateId)
    }));
    templateButtons = pgTable("template_buttons", {
      id: uuid("id").primaryKey().defaultRandom(),
      templateId: uuid("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
      type: varchar("type", { length: 50 }).notNull(),
      // 'quickReply', 'url', 'call'
      text: varchar("text", { length: 255 }).notNull(),
      url: text("url"),
      // For URL buttons
      phoneNumber: varchar("phone_number", { length: 50 }),
      // For call buttons
      index: integer("index").notNull(),
      // Button order
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      templateIdx: index("idx_template_buttons_template_id").on(table.templateId)
    }));
    whatsappCampaigns = pgTable("whatsapp_campaigns", {
      id: uuid("id").primaryKey().defaultRandom(),
      workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
      examId: uuid("exam_id").references(() => exams.id, { onDelete: "set null" }),
      templateId: uuid("template_id").notNull().references(() => templates.id, { onDelete: "restrict" }),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      status: varchar("status", { length: 50 }).notNull().default("draft"),
      // draft, scheduled, sending, sent, failed, cancelled
      scheduledAt: timestamp("scheduled_at"),
      startedAt: timestamp("started_at"),
      completedAt: timestamp("completed_at"),
      totalRecipients: integer("total_recipients").default(0),
      sentCount: integer("sent_count").default(0),
      deliveredCount: integer("delivered_count").default(0),
      failedCount: integer("failed_count").default(0),
      tags: jsonb("tags").$type(),
      // Array of tag keys for filtering
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      workspaceIdx: index("idx_whatsapp_campaigns_workspace_id").on(table.workspaceId),
      examIdx: index("idx_whatsapp_campaigns_exam_id").on(table.examId),
      templateIdx: index("idx_whatsapp_campaigns_template_id").on(table.templateId),
      statusIdx: index("idx_whatsapp_campaigns_status").on(table.status)
    }));
    whatsappCampaignRecipients = pgTable("whatsapp_campaign_recipients", {
      id: uuid("id").primaryKey().defaultRandom(),
      campaignId: uuid("campaign_id").notNull().references(() => whatsappCampaigns.id, { onDelete: "cascade" }),
      candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
      phoneNumber: varchar("phone_number", { length: 50 }).notNull(),
      status: varchar("status", { length: 50 }).notNull().default("pending"),
      // pending, sent, delivered, read, failed
      variables: jsonb("variables").$type(),
      // Variables for template personalization
      errorMessage: text("error_message"),
      sentAt: timestamp("sent_at"),
      deliveredAt: timestamp("delivered_at"),
      readAt: timestamp("read_at"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      campaignIdx: index("idx_whatsapp_campaign_recipients_campaign_id").on(table.campaignId),
      candidateIdx: index("idx_whatsapp_campaign_recipients_candidate_id").on(table.candidateId),
      statusIdx: index("idx_whatsapp_campaign_recipients_status").on(table.status),
      uniqueRecipient: unique("unique_campaign_recipient").on(table.campaignId, table.candidateId)
    }));
    createTableSQLString = `
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
  }
});

// src/domain/exams/exam.entity.ts
import { Entity } from "@oxlayer/foundation-domain-kit";
var Exam;
var init_exam_entity = __esm({
  "src/domain/exams/exam.entity.ts"() {
    "use strict";
    Exam = class _Exam extends Entity {
      get workspaceId() {
        return this.props.workspaceId;
      }
      get examName() {
        return this.props.examName;
      }
      get durationMinutes() {
        return this.props.durationMinutes;
      }
      get createdAt() {
        return this.props.createdAt;
      }
      get updatedAt() {
        return this.props.updatedAt;
      }
      constructor(props) {
        super(props.id);
        this.props = props;
      }
      /**
       * Update exam details
       */
      updateDetails(data) {
        if (data.examName !== void 0) {
          this.props.examName = data.examName;
        }
        if (data.durationMinutes !== void 0) {
          if (data.durationMinutes < 1 || data.durationMinutes > 120) {
            throw new Error("Duration must be between 1 and 120 minutes");
          }
          this.props.durationMinutes = data.durationMinutes;
        }
        this.props.updatedAt = /* @__PURE__ */ new Date();
      }
      /**
       * Create a new Exam
       */
      static create(data) {
        return new _Exam({
          id: data.id,
          workspaceId: data.workspaceId,
          examName: data.examName,
          durationMinutes: data.durationMinutes || 30,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        });
      }
      /**
       * Reconstruct from persistence
       */
      static fromPersistence(data) {
        return new _Exam(data);
      }
      /**
       * Convert to persistence format
       */
      toPersistence() {
        return { ...this.props };
      }
      /**
       * Convert to JSON for API responses
       * Called automatically by JSON.stringify()
       */
      toJSON() {
        return this.toPersistence();
      }
    };
  }
});

// src/repositories/exams/postgres-exam.repository.ts
var postgres_exam_repository_exports = {};
__export(postgres_exam_repository_exports, {
  PostgresExamRepository: () => PostgresExamRepository,
  default: () => postgres_exam_repository_default
});
import { eq, and, desc } from "drizzle-orm";
import { generateId } from "@oxlayer/foundation-domain-kit";
var PostgresExamRepository, postgres_exam_repository_default;
var init_postgres_exam_repository = __esm({
  "src/repositories/exams/postgres-exam.repository.ts"() {
    "use strict";
    init_schema();
    init_exam_entity();
    PostgresExamRepository = class {
      constructor(db) {
        this.db = db;
      }
      /**
       * Create a new exam
       */
      async create(data) {
        const id = data.id || generateId();
        const [examRow] = await this.db.insert(exams).values({
          id,
          workspaceId: data.workspaceId,
          examName: data.examName,
          durationMinutes: data.durationMinutes || 30
        }).returning();
        return Exam.fromPersistence({
          id: examRow.id,
          workspaceId: examRow.workspaceId,
          examName: examRow.examName,
          durationMinutes: examRow.durationMinutes,
          createdAt: examRow.createdAt,
          updatedAt: examRow.updatedAt
        });
      }
      /**
       * Find exam by ID
       */
      async findById(id) {
        const [examRow] = await this.db.select().from(exams).where(eq(exams.id, id)).limit(1);
        if (!examRow) {
          return null;
        }
        return Exam.fromPersistence({
          id: examRow.id,
          workspaceId: examRow.workspaceId,
          examName: examRow.examName,
          durationMinutes: examRow.durationMinutes,
          createdAt: examRow.createdAt,
          updatedAt: examRow.updatedAt
        });
      }
      /**
       * Find exams by filters
       */
      async find(filters) {
        const conditions = [];
        if (filters.workspaceId) {
          conditions.push(eq(exams.workspaceId, filters.workspaceId));
        }
        const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
        const examRows = await this.db.select().from(exams).where(whereClause).orderBy(desc(exams.createdAt));
        return examRows.map(
          (row) => Exam.fromPersistence({
            id: row.id,
            workspaceId: row.workspaceId,
            examName: row.examName,
            durationMinutes: row.durationMinutes,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
          })
        );
      }
      /**
       * Find exams by workspace ID
       */
      async findByWorkspace(workspaceId) {
        return this.find({ workspaceId });
      }
      /**
       * Update exam
       */
      async update(id, data) {
        const [examRow] = await this.db.update(exams).set({
          ...data.examName && { examName: data.examName },
          ...data.durationMinutes !== void 0 && { durationMinutes: data.durationMinutes },
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(exams.id, id)).returning();
        return Exam.fromPersistence({
          id: examRow.id,
          workspaceId: examRow.workspaceId,
          examName: examRow.examName,
          durationMinutes: examRow.durationMinutes,
          createdAt: examRow.createdAt,
          updatedAt: examRow.updatedAt
        });
      }
      /**
       * Delete exam
       */
      async delete(id) {
        await this.db.delete(exams).where(eq(exams.id, id));
      }
      /**
       * Check if exam exists
       */
      async exists(id) {
        const [exam] = await this.db.select({ id: exams.id }).from(exams).where(eq(exams.id, id)).limit(1);
        return !!exam;
      }
    };
    postgres_exam_repository_default = PostgresExamRepository;
  }
});

// src/domain/exams/question.entity.ts
import { Entity as Entity2 } from "@oxlayer/foundation-domain-kit";
var Question;
var init_question_entity = __esm({
  "src/domain/exams/question.entity.ts"() {
    "use strict";
    Question = class _Question extends Entity2 {
      get examId() {
        return this.props.examId;
      }
      get priority() {
        return this.props.priority;
      }
      get text() {
        return this.props.text;
      }
      get type() {
        return this.props.type;
      }
      get weight() {
        return this.props.weight;
      }
      get createdAt() {
        return this.props.createdAt;
      }
      get updatedAt() {
        return this.props.updatedAt;
      }
      constructor(props) {
        super(props.id);
        this.props = props;
      }
      /**
       * Update question priority
       */
      updatePriority(priority) {
        this.props.priority = priority;
        this.props.updatedAt = /* @__PURE__ */ new Date();
      }
      /**
       * Update question text
       */
      updateText(text3) {
        this.props.text = text3;
        this.props.updatedAt = /* @__PURE__ */ new Date();
      }
      /**
       * Create a new Question
       */
      static create(data) {
        return new _Question({
          id: data.id,
          examId: data.examId,
          priority: data.priority,
          text: data.text,
          type: data.type,
          weight: data.weight || "medium",
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        });
      }
      /**
       * Reconstruct from persistence
       */
      static fromPersistence(data) {
        return new _Question(data);
      }
      /**
       * Convert to persistence format
       */
      toPersistence() {
        return { ...this.props };
      }
      /**
       * Convert to JSON for API responses
       * Called automatically by JSON.stringify()
       */
      toJSON() {
        return this.toPersistence();
      }
    };
  }
});

// src/repositories/questions/postgres-question.repository.ts
var postgres_question_repository_exports = {};
__export(postgres_question_repository_exports, {
  PostgresQuestionRepository: () => PostgresQuestionRepository,
  default: () => postgres_question_repository_default
});
import { eq as eq2, asc, count, and as and2 } from "drizzle-orm";
import { generateId as generateId2 } from "@oxlayer/foundation-domain-kit";
var PostgresQuestionRepository, postgres_question_repository_default;
var init_postgres_question_repository = __esm({
  "src/repositories/questions/postgres-question.repository.ts"() {
    "use strict";
    init_schema();
    init_question_entity();
    PostgresQuestionRepository = class {
      constructor(db) {
        this.db = db;
      }
      /**
       * Create a new question
       */
      async create(data) {
        const id = generateId2();
        const [questionRow] = await this.db.insert(questions).values({
          id,
          examId: data.examId,
          priority: data.priority,
          text: data.text,
          type: data.type,
          weight: data.weight || "medium"
        }).returning();
        return Question.fromPersistence({
          id: questionRow.id,
          examId: questionRow.examId,
          priority: questionRow.priority,
          text: questionRow.text,
          type: questionRow.type,
          weight: questionRow.weight,
          createdAt: questionRow.createdAt,
          updatedAt: questionRow.updatedAt
        });
      }
      /**
       * Find question by ID
       */
      async findById(id) {
        const [questionRow] = await this.db.select().from(questions).where(eq2(questions.id, id)).limit(1);
        if (!questionRow) {
          return null;
        }
        return Question.fromPersistence({
          id: questionRow.id,
          examId: questionRow.examId,
          priority: questionRow.priority,
          text: questionRow.text,
          type: questionRow.type,
          weight: questionRow.weight || "medium",
          createdAt: questionRow.createdAt,
          updatedAt: questionRow.updatedAt
        });
      }
      /**
       * Find questions by exam ID
       */
      async findByExamId(examId) {
        const questionRows = await this.db.select().from(questions).where(eq2(questions.examId, examId)).orderBy(questions.priority);
        return questionRows.map(
          (row) => Question.fromPersistence({
            id: row.id,
            examId: row.examId,
            priority: row.priority,
            text: row.text,
            type: row.type,
            weight: row.weight || "medium",
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
          })
        );
      }
      /**
       * List questions with filters
       */
      async list(filters) {
        const limit = filters.limit ?? 50;
        const offset = filters.offset ?? 0;
        const conditions = [];
        if (filters.examId) {
          conditions.push(eq2(questions.examId, filters.examId));
        }
        if (filters.type) {
          conditions.push(eq2(questions.type, filters.type));
        }
        const whereClause = conditions.length > 0 ? and2(...conditions) : void 0;
        const [{ value: total }] = await this.db.select({ value: count() }).from(questions).where(whereClause);
        const questionRows = await this.db.select().from(questions).where(whereClause).orderBy(asc(questions.priority)).limit(limit).offset(offset);
        return {
          questions: questionRows.map(
            (row) => Question.fromPersistence({
              id: row.id,
              examId: row.examId,
              priority: row.priority,
              text: row.text,
              type: row.type,
              weight: row.weight || "medium",
              createdAt: row.createdAt,
              updatedAt: row.updatedAt
            })
          ),
          total: Number(total)
        };
      }
      /**
       * Create multiple questions for an exam
       */
      async createBulk(data) {
        const questions2 = data.map((d) => ({
          id: generateId2(),
          examId: d.examId,
          priority: d.priority,
          text: d.text,
          type: d.type,
          weight: d.weight || "medium"
        }));
        const questionRows = await this.db.insert(questions).values(questions2).returning();
        return questionRows.map(
          (row) => Question.fromPersistence({
            id: row.id,
            examId: row.examId,
            priority: row.priority,
            text: row.text,
            type: row.type,
            weight: row.weight || "medium",
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
          })
        );
      }
      /**
       * Update question
       */
      async update(id, data) {
        const updates = {};
        if (data.priority !== void 0) updates.priority = data.priority;
        if (data.text !== void 0) updates.text = data.text;
        if (data.type !== void 0) updates.type = data.type;
        if (data.weight !== void 0) updates.weight = data.weight;
        const [questionRow] = await this.db.update(questions).set(updates).where(eq2(questions.id, id)).returning();
        return Question.fromPersistence({
          id: questionRow.id,
          examId: questionRow.examId,
          priority: questionRow.priority,
          text: questionRow.text,
          type: questionRow.type,
          weight: questionRow.weight || "medium",
          createdAt: questionRow.createdAt,
          updatedAt: questionRow.updatedAt
        });
      }
      /**
       * Delete question
       */
      async delete(id) {
        await this.db.delete(questions).where(eq2(questions.id, id));
      }
      /**
       * Delete questions by exam ID
       */
      async deleteByExamId(examId) {
        await this.db.delete(questions).where(eq2(questions.examId, examId));
      }
    };
    postgres_question_repository_default = PostgresQuestionRepository;
  }
});

// src/domain/evaluations/index.ts
import { Entity as Entity3 } from "@oxlayer/foundation-domain-kit";
var Candidate, ExamAssignment, Answer, EvaluationResult;
var init_evaluations = __esm({
  "src/domain/evaluations/index.ts"() {
    "use strict";
    Candidate = class _Candidate extends Entity3 {
      get id() {
        return this.props.id;
      }
      get workspaceId() {
        return this.props.workspaceId;
      }
      get name() {
        return this.props.name;
      }
      get email() {
        return this.props.email;
      }
      get cpf() {
        return this.props.cpf;
      }
      get externalId() {
        return this.props.externalId;
      }
      get createdAt() {
        return this.props.createdAt;
      }
      get updatedAt() {
        return this.props.updatedAt;
      }
      /**
       * Update candidate details
       */
      updateDetails(data) {
        if (data.name !== void 0) {
          this.props.name = data.name;
        }
        if (data.email !== void 0) {
          this.props.email = data.email;
        }
        if (data.cpf !== void 0) {
          this.props.cpf = data.cpf;
        }
        if (data.externalId !== void 0) {
          this.props.externalId = data.externalId;
        }
        this.props.updatedAt = /* @__PURE__ */ new Date();
      }
      /**
       * Create a new Candidate
       */
      static create(data) {
        return new _Candidate({
          id: data.id,
          workspaceId: data.workspaceId,
          name: data.name,
          email: data.email,
          cpf: data.cpf,
          externalId: data.externalId,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        });
      }
      /**
       * Reconstruct from persistence
       */
      static fromPersistence(data) {
        return new _Candidate(data);
      }
      /**
       * Convert to persistence format
       */
      toPersistence() {
        return { ...this.props };
      }
    };
    ExamAssignment = class _ExamAssignment extends Entity3 {
      get id() {
        return this.props.id;
      }
      get candidateId() {
        return this.props.candidateId;
      }
      get examId() {
        return this.props.examId;
      }
      get status() {
        return this.props.status;
      }
      get assignedAt() {
        return this.props.assignedAt;
      }
      get completedAt() {
        return this.props.completedAt;
      }
      get expiresAt() {
        return this.props.expiresAt;
      }
      get createdAt() {
        return this.props.createdAt;
      }
      get updatedAt() {
        return this.props.updatedAt;
      }
      /**
       * Check if assignment is expired
       */
      isExpired() {
        if (!this.props.expiresAt) return false;
        return /* @__PURE__ */ new Date() > this.props.expiresAt;
      }
      /**
       * Mark assignment as in progress
       */
      markAsInProgress() {
        if (this.props.status === "in_progress") return;
        if (this.isExpired()) {
          throw new Error("Cannot start an expired assignment");
        }
        this.props.status = "in_progress";
        this.props.updatedAt = /* @__PURE__ */ new Date();
      }
      /**
       * Mark assignment as completed
       */
      markAsCompleted() {
        if (this.props.status === "completed") return;
        this.props.status = "completed";
        this.props.completedAt = /* @__PURE__ */ new Date();
        this.props.updatedAt = /* @__PURE__ */ new Date();
      }
      /**
       * Mark assignment as expired
       */
      markAsExpired() {
        if (this.props.status === "expired") return;
        this.props.status = "expired";
        this.props.updatedAt = /* @__PURE__ */ new Date();
      }
      /**
       * Create a new Exam Assignment
       */
      static create(data) {
        return new _ExamAssignment({
          id: data.id,
          candidateId: data.candidateId,
          examId: data.examId,
          status: "pending",
          assignedAt: /* @__PURE__ */ new Date(),
          expiresAt: data.expiresAt,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        });
      }
      /**
       * Reconstruct from persistence
       */
      static fromPersistence(data) {
        return new _ExamAssignment(data);
      }
      /**
       * Convert to persistence format
       */
      toPersistence() {
        return { ...this.props };
      }
    };
    Answer = class _Answer extends Entity3 {
      get id() {
        return this.props.id;
      }
      get assignmentId() {
        return this.props.assignmentId;
      }
      get candidateId() {
        return this.props.candidateId;
      }
      get examId() {
        return this.props.examId;
      }
      get questionId() {
        return this.props.questionId;
      }
      get s3Url() {
        return this.props.s3Url;
      }
      get duration() {
        return this.props.duration;
      }
      get contentType() {
        return this.props.contentType;
      }
      get fileSize() {
        return this.props.fileSize;
      }
      get isValid() {
        return this.props.isValid;
      }
      get transcription() {
        return this.props.transcription;
      }
      get createdAt() {
        return this.props.createdAt;
      }
      get updatedAt() {
        return this.props.updatedAt;
      }
      /**
       * Mark answer as valid
       */
      markAsValid() {
        this.props.isValid = true;
        this.props.updatedAt = /* @__PURE__ */ new Date();
      }
      /**
       * Mark answer as invalid
       */
      markAsInvalid() {
        this.props.isValid = false;
        this.props.updatedAt = /* @__PURE__ */ new Date();
      }
      /**
       * Set transcription
       */
      setTranscription(transcription) {
        this.props.transcription = transcription;
        this.props.updatedAt = /* @__PURE__ */ new Date();
      }
      /**
       * Create a new Answer
       */
      static create(data) {
        return new _Answer({
          id: data.id,
          assignmentId: data.assignmentId,
          candidateId: data.candidateId,
          examId: data.examId,
          questionId: data.questionId,
          s3Url: data.s3Url,
          duration: data.duration,
          contentType: data.contentType,
          fileSize: data.fileSize,
          isValid: false,
          // Validated asynchronously
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        });
      }
      /**
       * Reconstruct from persistence
       */
      static fromPersistence(data) {
        return new _Answer(data);
      }
      /**
       * Convert to persistence format
       */
      toPersistence() {
        return { ...this.props };
      }
    };
    EvaluationResult = class _EvaluationResult extends Entity3 {
      get id() {
        return this.props.id;
      }
      get assignmentId() {
        return this.props.assignmentId;
      }
      get candidateId() {
        return this.props.candidateId;
      }
      get examId() {
        return this.props.examId;
      }
      get transcriptions() {
        return this.props.transcriptions;
      }
      get analysisResults() {
        return this.props.analysisResults;
      }
      get overallScore() {
        return this.props.overallScore;
      }
      get completionStatus() {
        return this.props.completionStatus;
      }
      get failureReason() {
        return this.props.failureReason;
      }
      get totalAnswers() {
        return this.props.totalAnswers;
      }
      get transcribedAnswers() {
        return this.props.transcribedAnswers;
      }
      get analyzedAnswers() {
        return this.props.analyzedAnswers;
      }
      get processingTimeMs() {
        return this.props.processingTimeMs;
      }
      get processedAt() {
        return this.props.processedAt;
      }
      get createdAt() {
        return this.props.createdAt;
      }
      get updatedAt() {
        return this.props.updatedAt;
      }
      /**
       * Get completion percentage
       */
      getCompletionPercentage() {
        if (this.props.totalAnswers === 0) return 0;
        return Math.round(this.props.analyzedAnswers / this.props.totalAnswers * 100);
      }
      /**
       * Check if evaluation completed successfully
       */
      isSuccessful() {
        return this.props.completionStatus === "completed";
      }
      /**
       * Check if evaluation partially completed
       */
      isPartial() {
        return this.props.completionStatus === "partial";
      }
      /**
       * Check if evaluation failed
       */
      isFailed() {
        return this.props.completionStatus === "failed";
      }
      /**
       * Update analysis results
       */
      updateAnalysis(data) {
        if (data.analysisResults !== void 0) {
          this.props.analysisResults = data.analysisResults;
        }
        if (data.overallScore !== void 0) {
          this.props.overallScore = data.overallScore;
        }
        if (data.completionStatus !== void 0) {
          this.props.completionStatus = data.completionStatus;
        }
        if (data.failureReason !== void 0) {
          this.props.failureReason = data.failureReason;
        }
        if (data.transcribedAnswers !== void 0) {
          this.props.transcribedAnswers = data.transcribedAnswers;
        }
        if (data.analyzedAnswers !== void 0) {
          this.props.analyzedAnswers = data.analyzedAnswers;
        }
        this.props.updatedAt = /* @__PURE__ */ new Date();
      }
      /**
       * Create a new Evaluation Result
       */
      static create(data) {
        return new _EvaluationResult({
          id: data.id,
          assignmentId: data.assignmentId,
          candidateId: data.candidateId,
          examId: data.examId,
          transcriptions: data.transcriptions,
          analysisResults: data.analysisResults,
          overallScore: data.overallScore,
          completionStatus: data.completionStatus,
          failureReason: data.failureReason,
          totalAnswers: data.totalAnswers,
          transcribedAnswers: data.transcribedAnswers,
          analyzedAnswers: data.analyzedAnswers,
          processingTimeMs: data.processingTimeMs,
          processedAt: /* @__PURE__ */ new Date(),
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        });
      }
      /**
       * Reconstruct from persistence
       */
      static fromPersistence(data) {
        return new _EvaluationResult(data);
      }
      /**
       * Convert to persistence format
       */
      toPersistence() {
        return { ...this.props };
      }
    };
  }
});

// src/repositories/candidates/postgres-candidate.repository.ts
var postgres_candidate_repository_exports = {};
__export(postgres_candidate_repository_exports, {
  PostgresCandidateRepository: () => PostgresCandidateRepository,
  default: () => postgres_candidate_repository_default
});
import { eq as eq3, and as and3 } from "drizzle-orm";
import { generateId as generateId3 } from "@oxlayer/foundation-domain-kit";
var PostgresCandidateRepository, postgres_candidate_repository_default;
var init_postgres_candidate_repository = __esm({
  "src/repositories/candidates/postgres-candidate.repository.ts"() {
    "use strict";
    init_schema();
    init_evaluations();
    PostgresCandidateRepository = class {
      constructor(db) {
        this.db = db;
      }
      /**
       * Create a new candidate
       */
      async create(data) {
        const id = data.id || generateId3();
        const [candidateRow] = await this.db.insert(candidates).values({
          id,
          workspaceId: data.workspaceId,
          name: data.name,
          email: data.email,
          cpf: data.cpf,
          externalId: data.externalId
        }).returning();
        return Candidate.fromPersistence({
          id: candidateRow.id,
          workspaceId: candidateRow.workspaceId,
          name: candidateRow.name,
          email: candidateRow.email,
          cpf: candidateRow.cpf,
          externalId: candidateRow.externalId,
          createdAt: candidateRow.createdAt,
          updatedAt: candidateRow.updatedAt
        });
      }
      /**
       * Find candidate by ID
       */
      async findById(id) {
        const [candidateRow] = await this.db.select().from(candidates).where(eq3(candidates.id, id)).limit(1);
        if (!candidateRow) {
          return null;
        }
        return Candidate.fromPersistence({
          id: candidateRow.id,
          workspaceId: candidateRow.workspaceId,
          name: candidateRow.name,
          email: candidateRow.email,
          cpf: candidateRow.cpf,
          externalId: candidateRow.externalId,
          createdAt: candidateRow.createdAt,
          updatedAt: candidateRow.updatedAt
        });
      }
      /**
       * Find candidates by filters
       */
      async find(filters) {
        const conditions = [];
        if (filters.workspaceId) {
          conditions.push(eq3(candidates.workspaceId, filters.workspaceId));
        }
        if (filters.cpf) {
          conditions.push(eq3(candidates.cpf, filters.cpf));
        }
        if (filters.externalId) {
          conditions.push(eq3(candidates.externalId, filters.externalId));
        }
        const whereClause = conditions.length > 0 ? and3(...conditions) : void 0;
        const candidateRows = await this.db.select().from(candidates).where(whereClause);
        return candidateRows.map(
          (row) => Candidate.fromPersistence({
            id: row.id,
            workspaceId: row.workspaceId,
            name: row.name,
            email: row.email,
            cpf: row.cpf,
            externalId: row.externalId,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
          })
        );
      }
      /**
       * Find candidate by CPF
       */
      async findByCpf(cpf) {
        const [candidateRow] = await this.db.select().from(candidates).where(eq3(candidates.cpf, cpf)).limit(1);
        if (!candidateRow) {
          return null;
        }
        return Candidate.fromPersistence({
          id: candidateRow.id,
          workspaceId: candidateRow.workspaceId,
          name: candidateRow.name,
          email: candidateRow.email,
          cpf: candidateRow.cpf,
          externalId: candidateRow.externalId,
          createdAt: candidateRow.createdAt,
          updatedAt: candidateRow.updatedAt
        });
      }
      /**
       * Find candidate by external ID
       */
      async findByExternalId(externalId) {
        const [candidateRow] = await this.db.select().from(candidates).where(eq3(candidates.externalId, externalId)).limit(1);
        if (!candidateRow) {
          return null;
        }
        return Candidate.fromPersistence({
          id: candidateRow.id,
          workspaceId: candidateRow.workspaceId,
          name: candidateRow.name,
          email: candidateRow.email,
          cpf: candidateRow.cpf,
          externalId: candidateRow.externalId,
          createdAt: candidateRow.createdAt,
          updatedAt: candidateRow.updatedAt
        });
      }
      /**
       * Find candidates by workspace
       */
      async findByWorkspace(workspaceId) {
        return this.find({ workspaceId });
      }
      /**
       * Update candidate
       */
      async update(id, data) {
        const [candidateRow] = await this.db.update(candidates).set({
          ...data.name && { name: data.name },
          ...data.email !== void 0 && { email: data.email },
          ...data.cpf !== void 0 && { cpf: data.cpf },
          ...data.externalId !== void 0 && { externalId: data.externalId },
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq3(candidates.id, id)).returning();
        return Candidate.fromPersistence({
          id: candidateRow.id,
          workspaceId: candidateRow.workspaceId,
          name: candidateRow.name,
          email: candidateRow.email,
          cpf: candidateRow.cpf,
          externalId: candidateRow.externalId,
          createdAt: candidateRow.createdAt,
          updatedAt: candidateRow.updatedAt
        });
      }
      /**
       * Delete candidate
       */
      async delete(id) {
        await this.db.delete(candidates).where(eq3(candidates.id, id));
      }
      /**
       * Check if candidate exists
       */
      async exists(id) {
        const [candidate] = await this.db.select({ id: candidates.id }).from(candidates).where(eq3(candidates.id, id)).limit(1);
        return !!candidate;
      }
    };
    postgres_candidate_repository_default = PostgresCandidateRepository;
  }
});

// src/repositories/exam-assignments/postgres-exam-assignment.repository.ts
var postgres_exam_assignment_repository_exports = {};
__export(postgres_exam_assignment_repository_exports, {
  PostgresExamAssignmentRepository: () => PostgresExamAssignmentRepository,
  default: () => postgres_exam_assignment_repository_default
});
import { eq as eq4, and as and4 } from "drizzle-orm";
import { generateId as generateId4 } from "@oxlayer/foundation-domain-kit";
var PostgresExamAssignmentRepository, postgres_exam_assignment_repository_default;
var init_postgres_exam_assignment_repository = __esm({
  "src/repositories/exam-assignments/postgres-exam-assignment.repository.ts"() {
    "use strict";
    init_schema();
    init_evaluations();
    PostgresExamAssignmentRepository = class {
      constructor(db) {
        this.db = db;
      }
      /**
       * Create a new exam assignment
       */
      async create(data) {
        const id = data.id || generateId4();
        const [assignmentRow] = await this.db.insert(examAssignments).values({
          id,
          candidateId: data.candidateId,
          examId: data.examId,
          status: "pending",
          assignedAt: /* @__PURE__ */ new Date(),
          expiresAt: data.expiresAt
        }).returning();
        return ExamAssignment.fromPersistence({
          id: assignmentRow.id,
          candidateId: assignmentRow.candidateId,
          examId: assignmentRow.examId,
          status: assignmentRow.status,
          assignedAt: assignmentRow.assignedAt,
          completedAt: assignmentRow.completedAt,
          expiresAt: assignmentRow.expiresAt,
          createdAt: assignmentRow.createdAt,
          updatedAt: assignmentRow.updatedAt
        });
      }
      /**
       * Find assignment by ID
       */
      async findById(id) {
        const [row] = await this.db.select().from(examAssignments).where(eq4(examAssignments.id, id)).limit(1);
        if (!row) return null;
        return ExamAssignment.fromPersistence({
          id: row.id,
          candidateId: row.candidateId,
          examId: row.examId,
          status: row.status,
          assignedAt: row.assignedAt,
          completedAt: row.completedAt,
          expiresAt: row.expiresAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        });
      }
      /**
       * Find assignments by candidate ID
       */
      async findByCandidateId(candidateId) {
        const rows = await this.db.select().from(examAssignments).where(eq4(examAssignments.candidateId, candidateId));
        return rows.map((row) => ExamAssignment.fromPersistence({
          id: row.id,
          candidateId: row.candidateId,
          examId: row.examId,
          status: row.status,
          assignedAt: row.assignedAt,
          completedAt: row.completedAt,
          expiresAt: row.expiresAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        }));
      }
      /**
       * Find assignments by exam ID
       */
      async findByExamId(examId) {
        const rows = await this.db.select().from(examAssignments).where(eq4(examAssignments.examId, examId));
        return rows.map((row) => ExamAssignment.fromPersistence({
          id: row.id,
          candidateId: row.candidateId,
          examId: row.examId,
          status: row.status,
          assignedAt: row.assignedAt,
          completedAt: row.completedAt,
          expiresAt: row.expiresAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        }));
      }
      /**
       * Find pending or in-progress assignments
       */
      async findPendingByCandidate(candidateId) {
        const rows = await this.db.select().from(examAssignments).where(
          and4(
            eq4(examAssignments.candidateId, candidateId),
            eq4(examAssignments.status, "pending")
          )
        );
        return rows.map((row) => ExamAssignment.fromPersistence({
          id: row.id,
          candidateId: row.candidateId,
          examId: row.examId,
          status: row.status,
          assignedAt: row.assignedAt,
          completedAt: row.completedAt,
          expiresAt: row.expiresAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        }));
      }
      /**
       * Update assignment status
       */
      async updateStatus(id, status) {
        const updateData = {
          status,
          updatedAt: /* @__PURE__ */ new Date()
        };
        if (status === "completed") {
          updateData.completedAt = /* @__PURE__ */ new Date();
        }
        const [row] = await this.db.update(examAssignments).set(updateData).where(eq4(examAssignments.id, id)).returning();
        return ExamAssignment.fromPersistence({
          id: row.id,
          candidateId: row.candidateId,
          examId: row.examId,
          status: row.status,
          assignedAt: row.assignedAt,
          completedAt: row.completedAt,
          expiresAt: row.expiresAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        });
      }
      /**
       * Delete assignment
       */
      async delete(id) {
        await this.db.delete(examAssignments).where(eq4(examAssignments.id, id));
      }
    };
    postgres_exam_assignment_repository_default = PostgresExamAssignmentRepository;
  }
});

// src/repositories/answers/postgres-answer.repository.ts
var postgres_answer_repository_exports = {};
__export(postgres_answer_repository_exports, {
  PostgresAnswerRepository: () => PostgresAnswerRepository,
  default: () => postgres_answer_repository_default
});
import { eq as eq5, and as and5, count as count2 } from "drizzle-orm";
import { generateId as generateId5 } from "@oxlayer/foundation-domain-kit";
var PostgresAnswerRepository, postgres_answer_repository_default;
var init_postgres_answer_repository = __esm({
  "src/repositories/answers/postgres-answer.repository.ts"() {
    "use strict";
    init_schema();
    init_evaluations();
    PostgresAnswerRepository = class {
      constructor(db) {
        this.db = db;
      }
      /**
       * Create a new answer
       */
      async create(data) {
        const id = data.id || generateId5();
        const [row] = await this.db.insert(answers).values({
          id,
          assignmentId: data.assignmentId,
          candidateId: data.candidateId,
          examId: data.examId,
          questionId: data.questionId,
          s3Url: data.s3Url,
          duration: data.duration.toString(),
          contentType: data.contentType,
          fileSize: data.fileSize.toString(),
          isValid: false
        }).returning();
        return Answer.fromPersistence({
          id: row.id,
          assignmentId: row.assignmentId,
          candidateId: row.candidateId,
          examId: row.examId,
          questionId: row.questionId,
          s3Url: row.s3Url,
          duration: parseFloat(row.duration),
          contentType: row.contentType,
          fileSize: parseFloat(row.fileSize),
          isValid: row.isValid,
          transcription: row.transcription,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        });
      }
      /**
       * Find answer by ID
       */
      async findById(id) {
        const [row] = await this.db.select().from(answers).where(eq5(answers.id, id)).limit(1);
        if (!row) return null;
        return Answer.fromPersistence({
          id: row.id,
          assignmentId: row.assignmentId,
          candidateId: row.candidateId,
          examId: row.examId,
          questionId: row.questionId,
          s3Url: row.s3Url,
          duration: parseFloat(row.duration),
          contentType: row.contentType,
          fileSize: parseFloat(row.fileSize),
          isValid: row.isValid,
          transcription: row.transcription,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        });
      }
      /**
       * Find answers by assignment ID
       */
      async findByAssignmentId(assignmentId) {
        const rows = await this.db.select().from(answers).where(eq5(answers.assignmentId, assignmentId));
        return rows.map((row) => Answer.fromPersistence({
          id: row.id,
          assignmentId: row.assignmentId,
          candidateId: row.candidateId,
          examId: row.examId,
          questionId: row.questionId,
          s3Url: row.s3Url,
          duration: parseFloat(row.duration),
          contentType: row.contentType,
          fileSize: parseFloat(row.fileSize),
          isValid: row.isValid,
          transcription: row.transcription,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        }));
      }
      /**
       * Find answers by candidate ID
       */
      async findByCandidateId(candidateId) {
        const rows = await this.db.select().from(answers).where(eq5(answers.candidateId, candidateId));
        return rows.map((row) => Answer.fromPersistence({
          id: row.id,
          assignmentId: row.assignmentId,
          candidateId: row.candidateId,
          examId: row.examId,
          questionId: row.questionId,
          s3Url: row.s3Url,
          duration: parseFloat(row.duration),
          contentType: row.contentType,
          fileSize: parseFloat(row.fileSize),
          isValid: row.isValid,
          transcription: row.transcription,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        }));
      }
      /**
       * Find answer by question ID
       */
      async findByQuestionId(questionId) {
        const [row] = await this.db.select().from(answers).where(eq5(answers.questionId, questionId)).limit(1);
        if (!row) throw new Error("Answer not found");
        return Answer.fromPersistence({
          id: row.id,
          assignmentId: row.assignmentId,
          candidateId: row.candidateId,
          examId: row.examId,
          questionId: row.questionId,
          s3Url: row.s3Url,
          duration: parseFloat(row.duration),
          contentType: row.contentType,
          fileSize: parseFloat(row.fileSize),
          isValid: row.isValid,
          transcription: row.transcription,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        });
      }
      /**
       * List answers with filters
       */
      async list(filters) {
        const limit = filters.limit ?? 50;
        const offset = filters.offset ?? 0;
        const conditions = [];
        if (filters.assignmentId) {
          conditions.push(eq5(answers.assignmentId, filters.assignmentId));
        }
        if (filters.candidateId) {
          conditions.push(eq5(answers.candidateId, filters.candidateId));
        }
        if (filters.examId) {
          conditions.push(eq5(answers.examId, filters.examId));
        }
        if (filters.questionId) {
          conditions.push(eq5(answers.questionId, filters.questionId));
        }
        if (filters.isValid !== void 0) {
          conditions.push(eq5(answers.isValid, filters.isValid));
        }
        const whereClause = conditions.length > 0 ? and5(...conditions) : void 0;
        const [{ value: total }] = await this.db.select({ value: count2() }).from(answers).where(whereClause);
        const rows = await this.db.select().from(answers).where(whereClause).limit(limit).offset(offset);
        return {
          answers: rows.map((row) => Answer.fromPersistence({
            id: row.id,
            assignmentId: row.assignmentId,
            candidateId: row.candidateId,
            examId: row.examId,
            questionId: row.questionId,
            s3Url: row.s3Url,
            duration: parseFloat(row.duration),
            contentType: row.contentType,
            fileSize: parseFloat(row.fileSize),
            isValid: row.isValid,
            transcription: row.transcription,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
          })),
          total: Number(total)
        };
      }
      /**
       * Update answer transcription
       */
      async updateTranscription(id, transcription) {
        const [row] = await this.db.update(answers).set({
          transcription,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq5(answers.id, id)).returning();
        return Answer.fromPersistence({
          id: row.id,
          assignmentId: row.assignmentId,
          candidateId: row.candidateId,
          examId: row.examId,
          questionId: row.questionId,
          s3Url: row.s3Url,
          duration: parseFloat(row.duration),
          contentType: row.contentType,
          fileSize: parseFloat(row.fileSize),
          isValid: row.isValid,
          transcription: row.transcription,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        });
      }
      /**
       * Update answer
       */
      async update(id, data) {
        const updates = {};
        if (data.transcription !== void 0) updates.transcription = data.transcription;
        if (data.isValid !== void 0) updates.isValid = data.isValid;
        const [row] = await this.db.update(answers).set(updates).where(eq5(answers.id, id)).returning();
        return Answer.fromPersistence({
          id: row.id,
          assignmentId: row.assignmentId,
          candidateId: row.candidateId,
          examId: row.examId,
          questionId: row.questionId,
          s3Url: row.s3Url,
          duration: parseFloat(row.duration),
          contentType: row.contentType,
          fileSize: parseFloat(row.fileSize),
          isValid: row.isValid,
          transcription: row.transcription,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        });
      }
      /**
       * Mark answer as valid
       */
      async markAsValid(id) {
        const [row] = await this.db.update(answers).set({
          isValid: true,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq5(answers.id, id)).returning();
        return Answer.fromPersistence({
          id: row.id,
          assignmentId: row.assignmentId,
          candidateId: row.candidateId,
          examId: row.examId,
          questionId: row.questionId,
          s3Url: row.s3Url,
          duration: parseFloat(row.duration),
          contentType: row.contentType,
          fileSize: parseFloat(row.fileSize),
          isValid: row.isValid,
          transcription: row.transcription,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        });
      }
      /**
       * Mark answer as invalid
       */
      async markAsInvalid(id) {
        const [row] = await this.db.update(answers).set({
          isValid: false,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq5(answers.id, id)).returning();
        return Answer.fromPersistence({
          id: row.id,
          assignmentId: row.assignmentId,
          candidateId: row.candidateId,
          examId: row.examId,
          questionId: row.questionId,
          s3Url: row.s3Url,
          duration: parseFloat(row.duration),
          contentType: row.contentType,
          fileSize: parseFloat(row.fileSize),
          isValid: row.isValid,
          transcription: row.transcription,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        });
      }
      /**
       * Delete answer
       */
      async delete(id) {
        await this.db.delete(answers).where(eq5(answers.id, id));
      }
    };
    postgres_answer_repository_default = PostgresAnswerRepository;
  }
});

// src/repositories/evaluation-results/postgres-evaluation-result.repository.ts
var postgres_evaluation_result_repository_exports = {};
__export(postgres_evaluation_result_repository_exports, {
  PostgresEvaluationResultRepository: () => PostgresEvaluationResultRepository,
  default: () => postgres_evaluation_result_repository_default
});
import { eq as eq6 } from "drizzle-orm";
import { generateId as generateId6 } from "@oxlayer/foundation-domain-kit";
var PostgresEvaluationResultRepository, postgres_evaluation_result_repository_default;
var init_postgres_evaluation_result_repository = __esm({
  "src/repositories/evaluation-results/postgres-evaluation-result.repository.ts"() {
    "use strict";
    init_schema();
    init_evaluations();
    PostgresEvaluationResultRepository = class {
      constructor(db) {
        this.db = db;
      }
      /**
       * Create a new evaluation result
       */
      async create(data) {
        const id = data.id || generateId6();
        const [row] = await this.db.insert(evaluationResults).values({
          id,
          assignmentId: data.assignmentId,
          candidateId: data.candidateId,
          examId: data.examId,
          transcriptions: data.transcriptions,
          analysisResults: data.analysisResults,
          overallScore: data.overallScore.toString(),
          completionStatus: data.completionStatus,
          failureReason: data.failureReason,
          totalAnswers: data.totalAnswers,
          transcribedAnswers: data.transcribedAnswers,
          analyzedAnswers: data.analyzedAnswers,
          processingTimeMs: data.processingTimeMs,
          processedAt: /* @__PURE__ */ new Date()
        }).returning();
        return EvaluationResult.fromPersistence({
          id: row.id,
          assignmentId: row.assignmentId,
          candidateId: row.candidateId,
          examId: row.examId,
          transcriptions: row.transcriptions,
          analysisResults: row.analysisResults,
          overallScore: parseFloat(row.overallScore),
          completionStatus: row.completionStatus,
          failureReason: row.failureReason,
          totalAnswers: row.totalAnswers,
          transcribedAnswers: row.transcribedAnswers,
          analyzedAnswers: row.analyzedAnswers,
          processingTimeMs: row.processingTimeMs,
          processedAt: row.processedAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        });
      }
      /**
       * Find evaluation result by ID
       */
      async findById(id) {
        const [row] = await this.db.select().from(evaluationResults).where(eq6(evaluationResults.id, id)).limit(1);
        if (!row) return null;
        return EvaluationResult.fromPersistence({
          id: row.id,
          assignmentId: row.assignmentId,
          candidateId: row.candidateId,
          examId: row.examId,
          transcriptions: row.transcriptions,
          analysisResults: row.analysisResults,
          overallScore: parseFloat(row.overallScore),
          completionStatus: row.completionStatus,
          failureReason: row.failureReason,
          totalAnswers: row.totalAnswers,
          transcribedAnswers: row.transcribedAnswers,
          analyzedAnswers: row.analyzedAnswers,
          processingTimeMs: row.processingTimeMs,
          processedAt: row.processedAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        });
      }
      /**
       * Find evaluation results by candidate ID
       */
      async findByCandidateId(candidateId) {
        const rows = await this.db.select().from(evaluationResults).where(eq6(evaluationResults.candidateId, candidateId));
        return rows.map((row) => EvaluationResult.fromPersistence({
          id: row.id,
          assignmentId: row.assignmentId,
          candidateId: row.candidateId,
          examId: row.examId,
          transcriptions: row.transcriptions,
          analysisResults: row.analysisResults,
          overallScore: parseFloat(row.overallScore),
          completionStatus: row.completionStatus,
          failureReason: row.failureReason,
          totalAnswers: row.totalAnswers,
          transcribedAnswers: row.transcribedAnswers,
          analyzedAnswers: row.analyzedAnswers,
          processingTimeMs: row.processingTimeMs,
          processedAt: row.processedAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        }));
      }
      /**
       * Find evaluation results by exam ID
       */
      async findByExamId(examId) {
        const rows = await this.db.select().from(evaluationResults).where(eq6(evaluationResults.examId, examId));
        return rows.map((row) => EvaluationResult.fromPersistence({
          id: row.id,
          assignmentId: row.assignmentId,
          candidateId: row.candidateId,
          examId: row.examId,
          transcriptions: row.transcriptions,
          analysisResults: row.analysisResults,
          overallScore: parseFloat(row.overallScore),
          completionStatus: row.completionStatus,
          failureReason: row.failureReason,
          totalAnswers: row.totalAnswers,
          transcribedAnswers: row.transcribedAnswers,
          analyzedAnswers: row.analyzedAnswers,
          processingTimeMs: row.processingTimeMs,
          processedAt: row.processedAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        }));
      }
      /**
       * Find evaluation result by assignment ID
       */
      async findByAssignmentId(assignmentId) {
        const [row] = await this.db.select().from(evaluationResults).where(eq6(evaluationResults.assignmentId, assignmentId)).limit(1);
        if (!row) return null;
        return EvaluationResult.fromPersistence({
          id: row.id,
          assignmentId: row.assignmentId,
          candidateId: row.candidateId,
          examId: row.examId,
          transcriptions: row.transcriptions,
          analysisResults: row.analysisResults,
          overallScore: parseFloat(row.overallScore),
          completionStatus: row.completionStatus,
          failureReason: row.failureReason,
          totalAnswers: row.totalAnswers,
          transcribedAnswers: row.transcribedAnswers,
          analyzedAnswers: row.analyzedAnswers,
          processingTimeMs: row.processingTimeMs,
          processedAt: row.processedAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        });
      }
      /**
       * Update evaluation result
       */
      async update(id, data) {
        const updateData = {
          updatedAt: /* @__PURE__ */ new Date()
        };
        if (data.analysisResults !== void 0) {
          updateData.analysisResults = data.analysisResults;
        }
        if (data.overallScore !== void 0) {
          updateData.overallScore = data.overallScore.toString();
        }
        if (data.completionStatus !== void 0) {
          updateData.completionStatus = data.completionStatus;
        }
        if (data.failureReason !== void 0) {
          updateData.failureReason = data.failureReason;
        }
        if (data.transcribedAnswers !== void 0) {
          updateData.transcribedAnswers = data.transcribedAnswers;
        }
        if (data.analyzedAnswers !== void 0) {
          updateData.analyzedAnswers = data.analyzedAnswers;
        }
        const [row] = await this.db.update(evaluationResults).set(updateData).where(eq6(evaluationResults.id, id)).returning();
        return EvaluationResult.fromPersistence({
          id: row.id,
          assignmentId: row.assignmentId,
          candidateId: row.candidateId,
          examId: row.examId,
          transcriptions: row.transcriptions,
          analysisResults: row.analysisResults,
          overallScore: parseFloat(row.overallScore),
          completionStatus: row.completionStatus,
          failureReason: row.failureReason,
          totalAnswers: row.totalAnswers,
          transcribedAnswers: row.transcribedAnswers,
          analyzedAnswers: row.analyzedAnswers,
          processingTimeMs: row.processingTimeMs,
          processedAt: row.processedAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        });
      }
      /**
       * Delete evaluation result
       */
      async delete(id) {
        await this.db.delete(evaluationResults).where(eq6(evaluationResults.id, id));
      }
    };
    postgres_evaluation_result_repository_default = PostgresEvaluationResultRepository;
  }
});

// src/repositories/workspaces/postgres-workspace.repository.ts
var postgres_workspace_repository_exports = {};
__export(postgres_workspace_repository_exports, {
  PostgresWorkspaceRepository: () => PostgresWorkspaceRepository
});
import { eq as eq7, isNull, desc as desc2, count as count3 } from "drizzle-orm";
var PostgresWorkspaceRepository;
var init_postgres_workspace_repository = __esm({
  "src/repositories/workspaces/postgres-workspace.repository.ts"() {
    "use strict";
    init_schema();
    PostgresWorkspaceRepository = class {
      constructor(db) {
        this.db = db;
      }
      async create(input) {
        const [workspace] = await this.db.insert(workspaces).values({
          id: input.id,
          name: input.name,
          description: input.description,
          organizationId: input.organizationId,
          // Provisioning fields
          realmId: input.realmId,
          domainAliases: input.domainAliases,
          rootManagerEmail: input.rootManagerEmail
        }).returning();
        return {
          id: workspace.id,
          name: workspace.name,
          description: workspace.description,
          organizationId: workspace.organizationId,
          realmId: workspace.realmId,
          databaseName: workspace.databaseName,
          domainAliases: workspace.domainAliases,
          rootManagerEmail: workspace.rootManagerEmail,
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt,
          deletedAt: workspace.deletedAt
        };
      }
      async findById(id) {
        const [workspace] = await this.db.select().from(workspaces).where(eq7(workspaces.id, id));
        if (!workspace) {
          return null;
        }
        return {
          id: workspace.id,
          name: workspace.name,
          description: workspace.description,
          organizationId: workspace.organizationId,
          realmId: workspace.realmId,
          databaseName: workspace.databaseName,
          domainAliases: workspace.domainAliases,
          rootManagerEmail: workspace.rootManagerEmail,
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt,
          deletedAt: workspace.deletedAt
        };
      }
      async list(filters) {
        const limit = filters.limit ?? 50;
        const offset = filters.offset ?? 0;
        const conditions = [isNull(workspaces.deletedAt)];
        if (filters.organizationId) {
          conditions.push(eq7(workspaces.organizationId, filters.organizationId));
        }
        const [{ value: total }] = await this.db.select({ value: count3() }).from(workspaces).where(conditions[0]);
        const workspaces2 = await this.db.select().from(workspaces).where(conditions.length === 1 ? conditions[0] : conditions).orderBy(desc2(workspaces.createdAt)).limit(limit).offset(offset);
        return {
          workspaces: workspaces2.map((w) => ({
            id: w.id,
            name: w.name,
            description: w.description,
            organizationId: w.organizationId,
            realmId: w.realmId,
            databaseName: w.databaseName,
            domainAliases: w.domainAliases,
            rootManagerEmail: w.rootManagerEmail,
            createdAt: w.createdAt,
            updatedAt: w.updatedAt,
            deletedAt: w.deletedAt
          })),
          total: Number(total)
        };
      }
      async update(id, input) {
        const updates = {};
        if (input.name !== void 0) updates.name = input.name;
        if (input.description !== void 0) updates.description = input.description;
        const [workspace] = await this.db.update(workspaces).set(updates).where(eq7(workspaces.id, id)).returning();
        return {
          id: workspace.id,
          name: workspace.name,
          description: workspace.description,
          organizationId: workspace.organizationId,
          realmId: workspace.realmId,
          databaseName: workspace.databaseName,
          domainAliases: workspace.domainAliases,
          rootManagerEmail: workspace.rootManagerEmail,
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt,
          deletedAt: workspace.deletedAt
        };
      }
      async softDelete(id) {
        await this.db.update(workspaces).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq7(workspaces.id, id));
      }
    };
  }
});

// src/domain/tags/tag.entity.ts
import { Entity as Entity4 } from "@oxlayer/foundation-domain-kit";
var Tag;
var init_tag_entity = __esm({
  "src/domain/tags/tag.entity.ts"() {
    "use strict";
    Tag = class _Tag extends Entity4 {
      get id() {
        return this.props.id;
      }
      get workspaceId() {
        return this.props.workspaceId;
      }
      get key() {
        return this.props.key;
      }
      get value() {
        return this.props.value;
      }
      get isPrimary() {
        return this.props.isPrimary;
      }
      get description() {
        return this.props.description;
      }
      get color() {
        return this.props.color;
      }
      get createdAt() {
        return this.props.createdAt;
      }
      get updatedAt() {
        return this.props.updatedAt;
      }
      /**
       * Update tag details
       */
      updateDetails(data) {
        if (data.key !== void 0) {
          this.props.key = data.key;
        }
        if (data.value !== void 0) {
          this.props.value = data.value;
        }
        if (data.isPrimary !== void 0) {
          this.props.isPrimary = data.isPrimary;
        }
        if (data.description !== void 0) {
          this.props.description = data.description;
        }
        if (data.color !== void 0) {
          this.props.color = data.color;
        }
        this.props.updatedAt = /* @__PURE__ */ new Date();
      }
      /**
       * Create a new Tag
       */
      static create(data) {
        return new _Tag({
          id: data.id,
          workspaceId: data.workspaceId,
          key: data.key,
          value: data.value,
          isPrimary: data.isPrimary ?? false,
          description: data.description ?? null,
          color: data.color ?? null,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        });
      }
      /**
       * Reconstruct from persistence
       */
      static fromPersistence(data) {
        return new _Tag(data);
      }
      /**
       * Convert to persistence format
       */
      toPersistence() {
        return { ...this.props };
      }
    };
  }
});

// src/domain/tags/index.ts
var tags_exports = {};
__export(tags_exports, {
  Tag: () => Tag
});
var init_tags = __esm({
  "src/domain/tags/index.ts"() {
    "use strict";
    init_tag_entity();
  }
});

// src/repositories/tags/postgres-tag.repository.ts
var postgres_tag_repository_exports = {};
__export(postgres_tag_repository_exports, {
  PostgresTagRepository: () => PostgresTagRepository,
  default: () => postgres_tag_repository_default
});
import { eq as eq8, and as and6 } from "drizzle-orm";
import { generateId as generateId7 } from "@oxlayer/foundation-domain-kit";
var PostgresTagRepository, postgres_tag_repository_default;
var init_postgres_tag_repository = __esm({
  "src/repositories/tags/postgres-tag.repository.ts"() {
    "use strict";
    init_schema();
    init_tags();
    PostgresTagRepository = class {
      constructor(db) {
        this.db = db;
      }
      /**
       * Create a new tag
       */
      async create(data) {
        const id = data.id || generateId7();
        const [tagRow] = await this.db.insert(tags).values({
          id,
          workspaceId: data.workspaceId,
          key: data.key,
          value: data.value,
          isPrimary: data.isPrimary ?? false,
          description: data.description ?? null,
          color: data.color ?? null
        }).returning();
        return Tag.fromPersistence({
          id: tagRow.id,
          workspaceId: tagRow.workspaceId,
          key: tagRow.key,
          value: tagRow.value,
          isPrimary: tagRow.isPrimary,
          description: tagRow.description,
          color: tagRow.color,
          createdAt: tagRow.createdAt,
          updatedAt: tagRow.updatedAt
        });
      }
      /**
       * Find tag by ID
       */
      async findById(id) {
        const [tagRow] = await this.db.select().from(tags).where(eq8(tags.id, id)).limit(1);
        if (!tagRow) {
          return null;
        }
        return Tag.fromPersistence({
          id: tagRow.id,
          workspaceId: tagRow.workspaceId,
          key: tagRow.key,
          value: tagRow.value,
          isPrimary: tagRow.isPrimary,
          description: tagRow.description,
          color: tagRow.color,
          createdAt: tagRow.createdAt,
          updatedAt: tagRow.updatedAt
        });
      }
      /**
       * Find tags by filters
       */
      async find(filters) {
        const conditions = [];
        if (filters.workspaceId) {
          conditions.push(eq8(tags.workspaceId, filters.workspaceId));
        }
        if (filters.key) {
          conditions.push(eq8(tags.key, filters.key));
        }
        if (filters.value) {
          conditions.push(eq8(tags.value, filters.value));
        }
        if (filters.isPrimary !== void 0) {
          conditions.push(eq8(tags.isPrimary, filters.isPrimary));
        }
        const whereClause = conditions.length > 0 ? and6(...conditions) : void 0;
        const tagRows = await this.db.select().from(tags).where(whereClause).orderBy(tags.key, tags.value);
        return tagRows.map(
          (row) => Tag.fromPersistence({
            id: row.id,
            workspaceId: row.workspaceId,
            key: row.key,
            value: row.value,
            isPrimary: row.isPrimary,
            description: row.description,
            color: row.color,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
          })
        );
      }
      /**
       * Find tags by workspace
       */
      async findByWorkspace(workspaceId) {
        return this.find({ workspaceId });
      }
      /**
       * Find primary tags by workspace
       */
      async findPrimaryByWorkspace(workspaceId) {
        return this.find({ workspaceId, isPrimary: true });
      }
      /**
       * Get unique tag keys by workspace
       */
      async getKeysByWorkspace(workspaceId) {
        const rows = await this.db.selectDistinct({ key: tags.key }).from(tags).where(eq8(tags.workspaceId, workspaceId)).orderBy(tags.key);
        return rows.map((row) => row.key);
      }
      /**
       * Get unique tag values for a key by workspace
       */
      async getValuesByKey(workspaceId, key) {
        const rows = await this.db.selectDistinct({ value: tags.value }).from(tags).where(and6(eq8(tags.workspaceId, workspaceId), eq8(tags.key, key))).orderBy(tags.value);
        return rows.map((row) => row.value);
      }
      /**
       * Update tag
       */
      async update(id, data) {
        const [tagRow] = await this.db.update(tags).set({
          ...data.key !== void 0 && { key: data.key },
          ...data.value !== void 0 && { value: data.value },
          ...data.isPrimary !== void 0 && { isPrimary: data.isPrimary },
          ...data.description !== void 0 && { description: data.description },
          ...data.color !== void 0 && { color: data.color },
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq8(tags.id, id)).returning();
        return Tag.fromPersistence({
          id: tagRow.id,
          workspaceId: tagRow.workspaceId,
          key: tagRow.key,
          value: tagRow.value,
          isPrimary: tagRow.isPrimary,
          description: tagRow.description,
          color: tagRow.color,
          createdAt: tagRow.createdAt,
          updatedAt: tagRow.updatedAt
        });
      }
      /**
       * Delete tag
       */
      async delete(id) {
        await this.db.delete(tags).where(eq8(tags.id, id));
      }
      /**
       * Check if tag exists
       */
      async exists(id) {
        const [tag] = await this.db.select({ id: tags.id }).from(tags).where(eq8(tags.id, id)).limit(1);
        return !!tag;
      }
      /**
       * Find tag by workspace, key, and value
       */
      async findByWorkspaceKeyAndValue(workspaceId, key, value) {
        const [tagRow] = await this.db.select().from(tags).where(and6(
          eq8(tags.workspaceId, workspaceId),
          eq8(tags.key, key),
          eq8(tags.value, value)
        )).limit(1);
        if (!tagRow) {
          return null;
        }
        return Tag.fromPersistence({
          id: tagRow.id,
          workspaceId: tagRow.workspaceId,
          key: tagRow.key,
          value: tagRow.value,
          isPrimary: tagRow.isPrimary,
          description: tagRow.description,
          color: tagRow.color,
          createdAt: tagRow.createdAt,
          updatedAt: tagRow.updatedAt
        });
      }
    };
    postgres_tag_repository_default = PostgresTagRepository;
  }
});

// src/domain/templates/template.entity.ts
import { Entity as Entity5 } from "@oxlayer/foundation-domain-kit";
var Template;
var init_template_entity = __esm({
  "src/domain/templates/template.entity.ts"() {
    "use strict";
    Template = class _Template extends Entity5 {
      get id() {
        return this.props.id;
      }
      get workspaceId() {
        return this.props.workspaceId;
      }
      get name() {
        return this.props.name;
      }
      get type() {
        return this.props.type;
      }
      get subject() {
        return this.props.subject;
      }
      get body() {
        return this.props.body;
      }
      get variables() {
        return this.props.variables;
      }
      get category() {
        return this.props.category;
      }
      get language() {
        return this.props.language;
      }
      get isActive() {
        return this.props.isActive;
      }
      get externalId() {
        return this.props.externalId;
      }
      get status() {
        return this.props.status;
      }
      get createdAt() {
        return this.props.createdAt;
      }
      get updatedAt() {
        return this.props.updatedAt;
      }
      /**
       * Check if template is ready to use
       */
      isReady() {
        return this.props.isActive && this.props.status === "approved";
      }
      /**
       * Update template details
       */
      updateDetails(data) {
        if (data.name !== void 0) {
          this.props.name = data.name;
        }
        if (data.type !== void 0) {
          this.props.type = data.type;
        }
        if (data.subject !== void 0) {
          this.props.subject = data.subject;
        }
        if (data.body !== void 0) {
          this.props.body = data.body;
        }
        if (data.variables !== void 0) {
          this.props.variables = data.variables;
        }
        if (data.category !== void 0) {
          this.props.category = data.category;
        }
        if (data.language !== void 0) {
          this.props.language = data.language;
        }
        if (data.isActive !== void 0) {
          this.props.isActive = data.isActive;
        }
        if (data.externalId !== void 0) {
          this.props.externalId = data.externalId;
        }
        if (data.status !== void 0) {
          this.props.status = data.status;
        }
        this.props.updatedAt = /* @__PURE__ */ new Date();
      }
      /**
       * Create a new Template
       */
      static create(data) {
        return new _Template({
          id: data.id,
          workspaceId: data.workspaceId,
          name: data.name,
          type: data.type,
          subject: data.subject ?? null,
          body: data.body,
          variables: data.variables ?? null,
          category: data.category ?? null,
          language: data.language ?? "pt_BR",
          isActive: data.isActive ?? true,
          externalId: data.externalId ?? null,
          status: data.status ?? "draft",
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        });
      }
      /**
       * Reconstruct from persistence
       */
      static fromPersistence(data) {
        return new _Template(data);
      }
      /**
       * Convert to persistence format
       */
      toPersistence() {
        return { ...this.props };
      }
    };
  }
});

// src/domain/templates/index.ts
var templates_exports = {};
__export(templates_exports, {
  Template: () => Template
});
var init_templates = __esm({
  "src/domain/templates/index.ts"() {
    "use strict";
    init_template_entity();
  }
});

// src/repositories/templates/postgres-template.repository.ts
var postgres_template_repository_exports = {};
__export(postgres_template_repository_exports, {
  PostgresTemplateRepository: () => PostgresTemplateRepository,
  default: () => postgres_template_repository_default
});
import { eq as eq9, and as and7, desc as desc4 } from "drizzle-orm";
import { generateId as generateId8 } from "@oxlayer/foundation-domain-kit";
var PostgresTemplateRepository, postgres_template_repository_default;
var init_postgres_template_repository = __esm({
  "src/repositories/templates/postgres-template.repository.ts"() {
    "use strict";
    init_schema();
    init_templates();
    PostgresTemplateRepository = class {
      constructor(db) {
        this.db = db;
      }
      /**
       * Create a new template
       */
      async create(data) {
        const id = data.id || generateId8();
        const [templateRow] = await this.db.insert(templates).values({
          id,
          workspaceId: data.workspaceId,
          name: data.name,
          type: data.type,
          subject: data.subject ?? null,
          body: data.body,
          variables: data.variables ?? null,
          category: data.category ?? null,
          language: data.language ?? "pt_BR",
          isActive: data.isActive ?? true,
          externalId: data.externalId ?? null,
          status: data.status ?? "draft"
        }).returning();
        return Template.fromPersistence({
          id: templateRow.id,
          workspaceId: templateRow.workspaceId,
          name: templateRow.name,
          type: templateRow.type,
          subject: templateRow.subject,
          body: templateRow.body,
          variables: templateRow.variables,
          category: templateRow.category,
          language: templateRow.language,
          isActive: templateRow.isActive,
          externalId: templateRow.externalId,
          status: templateRow.status,
          createdAt: templateRow.createdAt,
          updatedAt: templateRow.updatedAt
        });
      }
      /**
       * Find template by ID
       */
      async findById(id) {
        const [templateRow] = await this.db.select().from(templates).where(eq9(templates.id, id)).limit(1);
        if (!templateRow) {
          return null;
        }
        return Template.fromPersistence({
          id: templateRow.id,
          workspaceId: templateRow.workspaceId,
          name: templateRow.name,
          type: templateRow.type,
          subject: templateRow.subject,
          body: templateRow.body,
          variables: templateRow.variables,
          category: templateRow.category,
          language: templateRow.language,
          isActive: templateRow.isActive,
          externalId: templateRow.externalId,
          status: templateRow.status,
          createdAt: templateRow.createdAt,
          updatedAt: templateRow.updatedAt
        });
      }
      /**
       * Find templates by filters
       */
      async find(filters) {
        const conditions = [];
        if (filters.workspaceId) {
          conditions.push(eq9(templates.workspaceId, filters.workspaceId));
        }
        if (filters.type) {
          conditions.push(eq9(templates.type, filters.type));
        }
        if (filters.category) {
          conditions.push(eq9(templates.category, filters.category));
        }
        if (filters.status) {
          conditions.push(eq9(templates.status, filters.status));
        }
        if (filters.isActive !== void 0) {
          conditions.push(eq9(templates.isActive, filters.isActive));
        }
        const whereClause = conditions.length > 0 ? and7(...conditions) : void 0;
        const templateRows = await this.db.select().from(templates).where(whereClause).orderBy(desc4(templates.createdAt));
        return templateRows.map(
          (row) => Template.fromPersistence({
            id: row.id,
            workspaceId: row.workspaceId,
            name: row.name,
            type: row.type,
            subject: row.subject,
            body: row.body,
            variables: row.variables,
            category: row.category,
            language: row.language,
            isActive: row.isActive,
            externalId: row.externalId,
            status: row.status,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
          })
        );
      }
      /**
       * Find templates by workspace
       */
      async findByWorkspace(workspaceId) {
        return this.find({ workspaceId });
      }
      /**
       * Find templates by type
       */
      async findByType(type) {
        return this.find({ type });
      }
      /**
       * Find active templates by workspace
       */
      async findActiveByWorkspace(workspaceId) {
        return this.find({ workspaceId, isActive: true });
      }
      /**
       * Update template
       */
      async update(id, data) {
        const [templateRow] = await this.db.update(templates).set({
          ...data.name !== void 0 && { name: data.name },
          ...data.type !== void 0 && { type: data.type },
          ...data.subject !== void 0 && { subject: data.subject },
          ...data.body !== void 0 && { body: data.body },
          ...data.variables !== void 0 && { variables: data.variables },
          ...data.category !== void 0 && { category: data.category },
          ...data.language !== void 0 && { language: data.language },
          ...data.isActive !== void 0 && { isActive: data.isActive },
          ...data.externalId !== void 0 && { externalId: data.externalId },
          ...data.status !== void 0 && { status: data.status },
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq9(templates.id, id)).returning();
        return Template.fromPersistence({
          id: templateRow.id,
          workspaceId: templateRow.workspaceId,
          name: templateRow.name,
          type: templateRow.type,
          subject: templateRow.subject,
          body: templateRow.body,
          variables: templateRow.variables,
          category: templateRow.category,
          language: templateRow.language,
          isActive: templateRow.isActive,
          externalId: templateRow.externalId,
          status: templateRow.status,
          createdAt: templateRow.createdAt,
          updatedAt: templateRow.updatedAt
        });
      }
      /**
       * Delete template
       */
      async delete(id) {
        await this.db.delete(templates).where(eq9(templates.id, id));
      }
      /**
       * Check if template exists
       */
      async exists(id) {
        const [template] = await this.db.select({ id: templates.id }).from(templates).where(eq9(templates.id, id)).limit(1);
        return !!template;
      }
      /**
       * Find template by external ID
       */
      async findByExternalId(externalId) {
        const [templateRow] = await this.db.select().from(templates).where(eq9(templates.externalId, externalId)).limit(1);
        if (!templateRow) {
          return null;
        }
        return Template.fromPersistence({
          id: templateRow.id,
          workspaceId: templateRow.workspaceId,
          name: templateRow.name,
          type: templateRow.type,
          subject: templateRow.subject,
          body: templateRow.body,
          variables: templateRow.variables,
          category: templateRow.category,
          language: templateRow.language,
          isActive: templateRow.isActive,
          externalId: templateRow.externalId,
          status: templateRow.status,
          createdAt: templateRow.createdAt,
          updatedAt: templateRow.updatedAt
        });
      }
    };
    postgres_template_repository_default = PostgresTemplateRepository;
  }
});

// src/domain/campaigns/whatsapp-campaign.entity.ts
import { Entity as Entity6 } from "@oxlayer/foundation-domain-kit";
var WhatsAppCampaign;
var init_whatsapp_campaign_entity = __esm({
  "src/domain/campaigns/whatsapp-campaign.entity.ts"() {
    "use strict";
    WhatsAppCampaign = class _WhatsAppCampaign extends Entity6 {
      constructor(props) {
        super(props.id);
        this.props = props;
      }
      get id() {
        return this.props.id;
      }
      get workspaceId() {
        return this.props.workspaceId;
      }
      get examId() {
        return this.props.examId;
      }
      get templateId() {
        return this.props.templateId;
      }
      get name() {
        return this.props.name;
      }
      get description() {
        return this.props.description;
      }
      get status() {
        return this.props.status;
      }
      get scheduledAt() {
        return this.props.scheduledAt;
      }
      get startedAt() {
        return this.props.startedAt;
      }
      get completedAt() {
        return this.props.completedAt;
      }
      get totalRecipients() {
        return this.props.totalRecipients;
      }
      get sentCount() {
        return this.props.sentCount;
      }
      get deliveredCount() {
        return this.props.deliveredCount;
      }
      get failedCount() {
        return this.props.failedCount;
      }
      get tags() {
        return this.props.tags;
      }
      get createdAt() {
        return this.props.createdAt;
      }
      get updatedAt() {
        return this.props.updatedAt;
      }
      /**
       * Check if campaign can be started
       */
      canStart() {
        return this.props.status === "draft" || this.props.status === "scheduled";
      }
      /**
       * Check if campaign is finished
       */
      isFinished() {
        return this.props.status === "sent" || this.props.status === "failed" || this.props.status === "cancelled";
      }
      /**
       * Start the campaign
       */
      start() {
        if (!this.canStart()) {
          throw new Error("Campaign cannot be started");
        }
        this.props.status = "sending";
        this.props.startedAt = /* @__PURE__ */ new Date();
        this.props.updatedAt = /* @__PURE__ */ new Date();
      }
      /**
       * Complete the campaign
       */
      complete() {
        if (this.props.status !== "sending") {
          throw new Error("Campaign is not in sending state");
        }
        this.props.status = "sent";
        this.props.completedAt = /* @__PURE__ */ new Date();
        this.props.updatedAt = /* @__PURE__ */ new Date();
      }
      /**
       * Mark campaign as failed
       */
      fail() {
        this.props.status = "failed";
        this.props.completedAt = /* @__PURE__ */ new Date();
        this.props.updatedAt = /* @__PURE__ */ new Date();
      }
      /**
       * Cancel the campaign
       */
      cancel() {
        if (this.isFinished()) {
          throw new Error("Cannot cancel a finished campaign");
        }
        this.props.status = "cancelled";
        this.props.completedAt = /* @__PURE__ */ new Date();
        this.props.updatedAt = /* @__PURE__ */ new Date();
      }
      /**
       * Update recipient counts
       */
      updateCounts(data) {
        if (data.sent !== void 0) {
          this.props.sentCount = data.sent;
        }
        if (data.delivered !== void 0) {
          this.props.deliveredCount = data.delivered;
        }
        if (data.failed !== void 0) {
          this.props.failedCount = data.failed;
        }
        this.props.updatedAt = /* @__PURE__ */ new Date();
      }
      /**
       * Update campaign details
       */
      updateDetails(data) {
        if (data.name !== void 0) {
          this.props.name = data.name;
        }
        if (data.description !== void 0) {
          this.props.description = data.description;
        }
        if (data.templateId !== void 0) {
          this.props.templateId = data.templateId;
        }
        if (data.scheduledAt !== void 0) {
          this.props.scheduledAt = data.scheduledAt;
          this.props.status = "scheduled";
        }
        if (data.tags !== void 0) {
          this.props.tags = data.tags;
        }
        this.props.updatedAt = /* @__PURE__ */ new Date();
      }
      /**
       * Create a new WhatsApp Campaign
       */
      static create(data) {
        const status = data.scheduledAt ? "scheduled" : "draft";
        return new _WhatsAppCampaign({
          id: data.id,
          workspaceId: data.workspaceId,
          examId: data.examId ?? null,
          templateId: data.templateId,
          name: data.name,
          description: data.description ?? null,
          status,
          scheduledAt: data.scheduledAt ?? null,
          startedAt: null,
          completedAt: null,
          totalRecipients: 0,
          sentCount: 0,
          deliveredCount: 0,
          failedCount: 0,
          tags: data.tags ?? null,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        });
      }
      /**
       * Reconstruct from persistence
       */
      static fromPersistence(data) {
        return new _WhatsAppCampaign(data);
      }
      /**
       * Convert to persistence format
       */
      toPersistence() {
        return { ...this.props };
      }
    };
  }
});

// src/domain/campaigns/index.ts
var campaigns_exports = {};
__export(campaigns_exports, {
  WhatsAppCampaign: () => WhatsAppCampaign
});
var init_campaigns = __esm({
  "src/domain/campaigns/index.ts"() {
    "use strict";
    init_whatsapp_campaign_entity();
  }
});

// src/repositories/campaigns/postgres-whatsapp-campaign.repository.ts
var postgres_whatsapp_campaign_repository_exports = {};
__export(postgres_whatsapp_campaign_repository_exports, {
  PostgresWhatsAppCampaignRepository: () => PostgresWhatsAppCampaignRepository,
  default: () => postgres_whatsapp_campaign_repository_default
});
import { eq as eq10, and as and8, desc as desc5 } from "drizzle-orm";
import { generateId as generateId9 } from "@oxlayer/foundation-domain-kit";
var PostgresWhatsAppCampaignRepository, postgres_whatsapp_campaign_repository_default;
var init_postgres_whatsapp_campaign_repository = __esm({
  "src/repositories/campaigns/postgres-whatsapp-campaign.repository.ts"() {
    "use strict";
    init_schema();
    init_campaigns();
    PostgresWhatsAppCampaignRepository = class {
      constructor(db) {
        this.db = db;
      }
      /**
       * Create a new campaign
       */
      async create(data) {
        const id = data.id || generateId9();
        const status = data.scheduledAt ? "scheduled" : "draft";
        const [campaignRow] = await this.db.insert(whatsappCampaigns).values({
          id,
          workspaceId: data.workspaceId,
          examId: data.examId ?? null,
          templateId: data.templateId,
          name: data.name,
          description: data.description ?? null,
          status,
          scheduledAt: data.scheduledAt ?? null,
          startedAt: null,
          completedAt: null,
          totalRecipients: 0,
          sentCount: 0,
          deliveredCount: 0,
          failedCount: 0,
          tags: data.tags ?? null
        }).returning();
        return WhatsAppCampaign.fromPersistence({
          id: campaignRow.id,
          workspaceId: campaignRow.workspaceId,
          examId: campaignRow.examId,
          templateId: campaignRow.templateId,
          name: campaignRow.name,
          description: campaignRow.description,
          status: campaignRow.status,
          scheduledAt: campaignRow.scheduledAt,
          startedAt: campaignRow.startedAt,
          completedAt: campaignRow.completedAt,
          totalRecipients: campaignRow.totalRecipients,
          sentCount: campaignRow.sentCount,
          deliveredCount: campaignRow.deliveredCount,
          failedCount: campaignRow.failedCount,
          tags: campaignRow.tags,
          createdAt: campaignRow.createdAt,
          updatedAt: campaignRow.updatedAt
        });
      }
      /**
       * Find campaign by ID
       */
      async findById(id) {
        const [campaignRow] = await this.db.select().from(whatsappCampaigns).where(eq10(whatsappCampaigns.id, id)).limit(1);
        if (!campaignRow) {
          return null;
        }
        return WhatsAppCampaign.fromPersistence({
          id: campaignRow.id,
          workspaceId: campaignRow.workspaceId,
          examId: campaignRow.examId,
          templateId: campaignRow.templateId,
          name: campaignRow.name,
          description: campaignRow.description,
          status: campaignRow.status,
          scheduledAt: campaignRow.scheduledAt,
          startedAt: campaignRow.startedAt,
          completedAt: campaignRow.completedAt,
          totalRecipients: campaignRow.totalRecipients,
          sentCount: campaignRow.sentCount,
          deliveredCount: campaignRow.deliveredCount,
          failedCount: campaignRow.failedCount,
          tags: campaignRow.tags,
          createdAt: campaignRow.createdAt,
          updatedAt: campaignRow.updatedAt
        });
      }
      /**
       * Find campaigns by filters
       */
      async find(filters) {
        const conditions = [];
        if (filters.workspaceId) {
          conditions.push(eq10(whatsappCampaigns.workspaceId, filters.workspaceId));
        }
        if (filters.examId) {
          conditions.push(eq10(whatsappCampaigns.examId, filters.examId));
        }
        if (filters.templateId) {
          conditions.push(eq10(whatsappCampaigns.templateId, filters.templateId));
        }
        if (filters.status) {
          conditions.push(eq10(whatsappCampaigns.status, filters.status));
        }
        const whereClause = conditions.length > 0 ? and8(...conditions) : void 0;
        const campaignRows = await this.db.select().from(whatsappCampaigns).where(whereClause).orderBy(desc5(whatsappCampaigns.createdAt));
        return campaignRows.map(
          (row) => WhatsAppCampaign.fromPersistence({
            id: row.id,
            workspaceId: row.workspaceId,
            examId: row.examId,
            templateId: row.templateId,
            name: row.name,
            description: row.description,
            status: row.status,
            scheduledAt: row.scheduledAt,
            startedAt: row.startedAt,
            completedAt: row.completedAt,
            totalRecipients: row.totalRecipients,
            sentCount: row.sentCount,
            deliveredCount: row.deliveredCount,
            failedCount: row.failedCount,
            tags: row.tags,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
          })
        );
      }
      /**
       * Find campaigns by workspace
       */
      async findByWorkspace(workspaceId) {
        return this.find({ workspaceId });
      }
      /**
       * Find campaigns by exam
       */
      async findByExam(examId) {
        return this.find({ examId });
      }
      /**
       * Find campaigns by status
       */
      async findByStatus(status) {
        return this.find({ status });
      }
      /**
       * Update campaign
       */
      async update(id, data) {
        const [campaignRow] = await this.db.update(whatsappCampaigns).set({
          ...data.name !== void 0 && { name: data.name },
          ...data.description !== void 0 && { description: data.description },
          ...data.templateId !== void 0 && { templateId: data.templateId },
          ...data.scheduledAt !== void 0 && {
            scheduledAt: data.scheduledAt,
            status: data.scheduledAt ? "scheduled" : "draft"
          },
          ...data.tags !== void 0 && { tags: data.tags },
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq10(whatsappCampaigns.id, id)).returning();
        return WhatsAppCampaign.fromPersistence({
          id: campaignRow.id,
          workspaceId: campaignRow.workspaceId,
          examId: campaignRow.examId,
          templateId: campaignRow.templateId,
          name: campaignRow.name,
          description: campaignRow.description,
          status: campaignRow.status,
          scheduledAt: campaignRow.scheduledAt,
          startedAt: campaignRow.startedAt,
          completedAt: campaignRow.completedAt,
          totalRecipients: campaignRow.totalRecipients,
          sentCount: campaignRow.sentCount,
          deliveredCount: campaignRow.deliveredCount,
          failedCount: campaignRow.failedCount,
          tags: campaignRow.tags,
          createdAt: campaignRow.createdAt,
          updatedAt: campaignRow.updatedAt
        });
      }
      /**
       * Update campaign counts
       */
      async updateCounts(id, data) {
        const [campaignRow] = await this.db.update(whatsappCampaigns).set({
          ...data.sent !== void 0 && { sentCount: data.sent },
          ...data.delivered !== void 0 && { deliveredCount: data.delivered },
          ...data.failed !== void 0 && { failedCount: data.failed },
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq10(whatsappCampaigns.id, id)).returning();
        return WhatsAppCampaign.fromPersistence({
          id: campaignRow.id,
          workspaceId: campaignRow.workspaceId,
          examId: campaignRow.examId,
          templateId: campaignRow.templateId,
          name: campaignRow.name,
          description: campaignRow.description,
          status: campaignRow.status,
          scheduledAt: campaignRow.scheduledAt,
          startedAt: campaignRow.startedAt,
          completedAt: campaignRow.completedAt,
          totalRecipients: campaignRow.totalRecipients,
          sentCount: campaignRow.sentCount,
          deliveredCount: campaignRow.deliveredCount,
          failedCount: campaignRow.failedCount,
          tags: campaignRow.tags,
          createdAt: campaignRow.createdAt,
          updatedAt: campaignRow.updatedAt
        });
      }
      /**
       * Update campaign status
       */
      async updateStatus(id, status) {
        const updates = { status, updatedAt: /* @__PURE__ */ new Date() };
        if (status === "sending") {
          updates.startedAt = /* @__PURE__ */ new Date();
        } else if (status === "sent" || status === "failed" || status === "cancelled") {
          updates.completedAt = /* @__PURE__ */ new Date();
        }
        const [campaignRow] = await this.db.update(whatsappCampaigns).set(updates).where(eq10(whatsappCampaigns.id, id)).returning();
        return WhatsAppCampaign.fromPersistence({
          id: campaignRow.id,
          workspaceId: campaignRow.workspaceId,
          examId: campaignRow.examId,
          templateId: campaignRow.templateId,
          name: campaignRow.name,
          description: campaignRow.description,
          status: campaignRow.status,
          scheduledAt: campaignRow.scheduledAt,
          startedAt: campaignRow.startedAt,
          completedAt: campaignRow.completedAt,
          totalRecipients: campaignRow.totalRecipients,
          sentCount: campaignRow.sentCount,
          deliveredCount: campaignRow.deliveredCount,
          failedCount: campaignRow.failedCount,
          tags: campaignRow.tags,
          createdAt: campaignRow.createdAt,
          updatedAt: campaignRow.updatedAt
        });
      }
      /**
       * Delete campaign
       */
      async delete(id) {
        await this.db.delete(whatsappCampaigns).where(eq10(whatsappCampaigns.id, id));
      }
      /**
       * Check if campaign exists
       */
      async exists(id) {
        const [campaign] = await this.db.select({ id: whatsappCampaigns.id }).from(whatsappCampaigns).where(eq10(whatsappCampaigns.id, id)).limit(1);
        return !!campaign;
      }
    };
    postgres_whatsapp_campaign_repository_default = PostgresWhatsAppCampaignRepository;
  }
});

// src/use-cases/exams/create-exam.use-case.ts
var create_exam_use_case_exports = {};
__export(create_exam_use_case_exports, {
  CreateExamUseCase: () => CreateExamUseCase
});
import { generateId as generateId10 } from "@oxlayer/foundation-domain-kit";
var CreateExamUseCase;
var init_create_exam_use_case = __esm({
  "src/use-cases/exams/create-exam.use-case.ts"() {
    "use strict";
    init_exam_entity();
    CreateExamUseCase = class {
      constructor(examRepository, questionRepository, eventBus) {
        this.examRepository = examRepository;
        this.questionRepository = questionRepository;
        this.eventBus = eventBus;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        this.validate(input);
        const exam = Exam.create({
          id: generateId10(),
          workspaceId: input.workspaceId,
          examName: input.examName,
          durationMinutes: input.durationMinutes
        });
        await this.examRepository.create({
          id: exam.id,
          workspaceId: exam.workspaceId,
          examName: exam.examName,
          durationMinutes: exam.durationMinutes,
          questions: input.questions
        });
        const questionIds = [];
        if (input.questions.length > 0) {
          const questions2 = await this.questionRepository.createBulk(
            input.questions.map((q) => ({
              examId: exam.id,
              priority: q.priority,
              text: q.text,
              type: q.type
            }))
          );
          questionIds.push(...questions2.map((q) => q.id));
        }
        await this.eventBus.publish(
          "globex.events",
          "exam.created",
          {
            examId: exam.id,
            examName: exam.examName,
            workspaceId: exam.workspaceId,
            questionCount: questionIds.length,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        );
        return {
          examId: exam.id,
          questionIds
        };
      }
      /**
       * Validate input
       */
      validate(input) {
        if (!input.examName || input.examName.trim().length === 0) {
          throw new Error("Exam name is required");
        }
        if (input.questions.length === 0) {
          throw new Error("At least one question is required");
        }
        if (input.questions.length > 50) {
          throw new Error("Maximum 50 questions allowed");
        }
        const priorities = /* @__PURE__ */ new Set();
        for (const question of input.questions) {
          if (!question.text || question.text.trim().length === 0) {
            throw new Error("Question text is required");
          }
          if (!["text", "audio"].includes(question.type)) {
            throw new Error('Question type must be "text" or "audio"');
          }
          if (priorities.has(question.priority)) {
            throw new Error(`Duplicate question priority: ${question.priority}`);
          }
          priorities.add(question.priority);
        }
        const duration = input.durationMinutes ?? 30;
        if (duration < 1 || duration > 120) {
          throw new Error("Duration must be between 1 and 120 minutes");
        }
      }
    };
  }
});

// src/use-cases/exams/get-exam.use-case.ts
var get_exam_use_case_exports = {};
__export(get_exam_use_case_exports, {
  GetExamUseCase: () => GetExamUseCase
});
var GetExamUseCase;
var init_get_exam_use_case = __esm({
  "src/use-cases/exams/get-exam.use-case.ts"() {
    "use strict";
    GetExamUseCase = class {
      constructor(examRepository, questionRepository) {
        this.examRepository = examRepository;
        this.questionRepository = questionRepository;
      }
      /**
       * Execute the use case - get exam with questions
       */
      async execute(input) {
        const exam = await this.examRepository.findById(input.id);
        if (!exam) {
          return null;
        }
        const questions2 = await this.questionRepository.findByExamId(exam.id);
        return {
          id: exam.id,
          workspaceId: exam.workspaceId,
          examName: exam.examName,
          durationMinutes: exam.durationMinutes,
          createdAt: exam.createdAt,
          updatedAt: exam.updatedAt,
          questions: questions2.map((q) => ({
            id: q.id,
            priority: q.priority,
            text: q.text,
            type: q.type
          }))
        };
      }
    };
  }
});

// src/use-cases/exams/delete-exam.use-case.ts
var delete_exam_use_case_exports = {};
__export(delete_exam_use_case_exports, {
  DeleteExamUseCase: () => DeleteExamUseCase
});
var DeleteExamUseCase;
var init_delete_exam_use_case = __esm({
  "src/use-cases/exams/delete-exam.use-case.ts"() {
    "use strict";
    DeleteExamUseCase = class {
      constructor(examRepository, questionRepository, eventBus) {
        this.examRepository = examRepository;
        this.questionRepository = questionRepository;
        this.eventBus = eventBus;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        this.validate(input);
        const exam = await this.examRepository.findById(input.id);
        if (!exam) {
          throw new Error("Exam not found");
        }
        await this.questionRepository.deleteByExamId(input.id);
        await this.examRepository.delete(input.id);
        await this.eventBus.publish(
          "globex.events",
          "exam.deleted",
          {
            examId: input.id,
            deletedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        );
        return {
          id: input.id,
          deleted: true
        };
      }
      /**
       * Validate input
       */
      validate(input) {
        if (!input.id || input.id.trim().length === 0) {
          throw new Error("Exam ID is required");
        }
      }
    };
  }
});

// src/use-cases/exams/list-exams.use-case.ts
var list_exams_use_case_exports = {};
__export(list_exams_use_case_exports, {
  ListExamsUseCase: () => ListExamsUseCase
});
var ListExamsUseCase;
var init_list_exams_use_case = __esm({
  "src/use-cases/exams/list-exams.use-case.ts"() {
    "use strict";
    ListExamsUseCase = class {
      constructor(examRepository) {
        this.examRepository = examRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        const exams2 = await this.examRepository.find({
          workspaceId: input.workspaceId
        });
        return exams2.map((exam) => ({
          id: exam.id,
          workspaceId: exam.workspaceId,
          examName: exam.examName,
          durationMinutes: exam.durationMinutes,
          createdAt: exam.createdAt,
          updatedAt: exam.updatedAt
        }));
      }
    };
  }
});

// src/use-cases/exams/update-exam.use-case.ts
var update_exam_use_case_exports = {};
__export(update_exam_use_case_exports, {
  UpdateExamUseCase: () => UpdateExamUseCase
});
var UpdateExamUseCase;
var init_update_exam_use_case = __esm({
  "src/use-cases/exams/update-exam.use-case.ts"() {
    "use strict";
    UpdateExamUseCase = class {
      constructor(examRepository) {
        this.examRepository = examRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        this.validate(input);
        const existingExam = await this.examRepository.findById(input.id);
        if (!existingExam) {
          throw new Error("Exam not found");
        }
        if (input.examName !== void 0) {
          existingExam.updateDetails({ examName: input.examName });
        }
        if (input.durationMinutes !== void 0) {
          existingExam.updateDetails({ durationMinutes: input.durationMinutes });
        }
        const updatedExam = await this.examRepository.update(input.id, {
          examName: input.examName,
          durationMinutes: input.durationMinutes
        });
        return updatedExam.toPersistence();
      }
      /**
       * Validate input
       */
      validate(input) {
        if (!input.id) {
          throw new Error("Exam ID is required");
        }
        if (input.examName !== void 0 && input.examName.trim().length === 0) {
          throw new Error("Exam name cannot be empty");
        }
        if (input.durationMinutes !== void 0) {
          if (input.durationMinutes < 1 || input.durationMinutes > 120) {
            throw new Error("Duration must be between 1 and 120 minutes");
          }
        }
        if (input.examName === void 0 && input.durationMinutes === void 0) {
          throw new Error("At least one field (examName or durationMinutes) must be provided for update");
        }
      }
    };
  }
});

// src/use-cases/exam-assignments/assign-exam.use-case.ts
var assign_exam_use_case_exports = {};
__export(assign_exam_use_case_exports, {
  AssignExamUseCase: () => AssignExamUseCase
});
import { generateId as generateId11 } from "@oxlayer/foundation-domain-kit";
var AssignExamUseCase;
var init_assign_exam_use_case = __esm({
  "src/use-cases/exam-assignments/assign-exam.use-case.ts"() {
    "use strict";
    init_evaluations();
    AssignExamUseCase = class {
      constructor(examAssignmentRepository, candidateRepository, examRepository, eventBus) {
        this.examAssignmentRepository = examAssignmentRepository;
        this.candidateRepository = candidateRepository;
        this.examRepository = examRepository;
        this.eventBus = eventBus;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        const candidate = await this.candidateRepository.findById(input.candidateId);
        if (!candidate) {
          throw new Error("Candidate not found");
        }
        const exam = await this.examRepository.findById(input.examId);
        if (!exam) {
          throw new Error("Exam not found");
        }
        const existingAssignments = await this.examAssignmentRepository.findByExamId(input.examId);
        const pendingAssignment = existingAssignments.find(
          (a) => a.candidateId === input.candidateId && (a.status === "pending" || a.status === "in_progress")
        );
        if (pendingAssignment) {
          throw new Error("Candidate already has a pending or in-progress assignment for this exam");
        }
        const assignment = ExamAssignment.create({
          id: generateId11(),
          candidateId: input.candidateId,
          examId: input.examId,
          expiresAt: input.expiresAt
        });
        const savedAssignment = await this.examAssignmentRepository.create({
          candidateId: assignment.candidateId,
          examId: assignment.examId,
          expiresAt: assignment.expiresAt
        });
        await this.eventBus.publish(
          "globex.events",
          "exam.assigned",
          {
            assignmentId: assignment.id,
            examId: assignment.examId,
            examName: exam.examName,
            candidateId: assignment.candidateId,
            candidateName: candidate.name,
            workspaceId: exam.workspaceId,
            assignedAt: assignment.assignedAt.toISOString(),
            expiresAt: assignment.expiresAt?.toISOString()
          }
        );
        return {
          assignmentId: savedAssignment.id,
          candidateId: savedAssignment.candidateId,
          examId: savedAssignment.examId,
          status: savedAssignment.status,
          assignedAt: savedAssignment.assignedAt,
          expiresAt: savedAssignment.expiresAt
        };
      }
    };
  }
});

// src/use-cases/evaluations/bulk-evaluate.use-case.ts
var bulk_evaluate_use_case_exports = {};
__export(bulk_evaluate_use_case_exports, {
  BulkEvaluateUseCase: () => BulkEvaluateUseCase
});
import { generateId as generateId12 } from "@oxlayer/foundation-domain-kit";
var BulkEvaluateUseCase;
var init_bulk_evaluate_use_case = __esm({
  "src/use-cases/evaluations/bulk-evaluate.use-case.ts"() {
    "use strict";
    BulkEvaluateUseCase = class {
      constructor(candidateRepository, examAssignmentRepository, answerRepository, evaluationResultRepository, eventBus) {
        this.candidateRepository = candidateRepository;
        this.examAssignmentRepository = examAssignmentRepository;
        this.answerRepository = answerRepository;
        this.evaluationResultRepository = evaluationResultRepository;
        this.eventBus = eventBus;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        const results = [];
        for (const user of input.users) {
          try {
            let candidate;
            if (user.cpf) {
              const existingByCpf = await this.candidateRepository.findByCpf(user.cpf);
              if (existingByCpf) {
                candidate = existingByCpf;
              } else {
                candidate = await this.candidateRepository.create({
                  id: generateId12(),
                  workspaceId: input.workspaceId,
                  name: user.name || user.userId,
                  email: user.email,
                  cpf: user.cpf,
                  externalId: user.externalId
                });
              }
            } else if (user.externalId) {
              const existingByExternalId = await this.candidateRepository.findByExternalId(user.externalId);
              if (existingByExternalId) {
                candidate = existingByExternalId;
              } else {
                candidate = await this.candidateRepository.create({
                  id: generateId12(),
                  workspaceId: input.workspaceId,
                  name: user.name || user.userId,
                  email: user.email,
                  externalId: user.externalId
                });
              }
            } else {
              candidate = await this.candidateRepository.create({
                id: generateId12(),
                workspaceId: input.workspaceId,
                name: user.name || user.userId,
                email: user.email,
                externalId: user.userId
              });
            }
            const existingAssignments = await this.examAssignmentRepository.findByExamId(input.examId);
            const existingAssignment = existingAssignments.find(
              (a) => a.candidateId === candidate.id && (a.status === "pending" || a.status === "in_progress")
            );
            let assignmentId;
            if (existingAssignment) {
              assignmentId = existingAssignment.id;
            } else {
              const assignment = await this.examAssignmentRepository.create({
                candidateId: candidate.id,
                examId: input.examId,
                // Default expiration: 7 days from now
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
              });
              assignmentId = assignment.id;
              await this.eventBus.publish(
                "globex.events",
                "exam.assigned",
                {
                  assignmentId: assignment.id,
                  examId: input.examId,
                  candidateId: candidate.id,
                  candidateName: candidate.name,
                  workspaceId: input.workspaceId
                }
              );
            }
            results.push({
              userId: user.userId,
              success: true,
              message: "Assignment created successfully",
              assignmentId
            });
          } catch (error) {
            results.push({
              userId: user.userId,
              success: false,
              message: error.message || "Failed to create assignment"
            });
          }
        }
        await this.eventBus.publish(
          "globex.events",
          "evaluation.bulk_completed",
          {
            examId: input.examId,
            workspaceId: input.workspaceId,
            totalUsers: input.users.length,
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }
        );
        return {
          success: true,
          results
        };
      }
    };
  }
});

// src/use-cases/evaluations/get-evaluation.use-case.ts
var get_evaluation_use_case_exports = {};
__export(get_evaluation_use_case_exports, {
  GetEvaluationUseCase: () => GetEvaluationUseCase
});
var GetEvaluationUseCase;
var init_get_evaluation_use_case = __esm({
  "src/use-cases/evaluations/get-evaluation.use-case.ts"() {
    "use strict";
    GetEvaluationUseCase = class {
      constructor(evaluationResultRepository) {
        this.evaluationResultRepository = evaluationResultRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        const evaluation = await this.evaluationResultRepository.findById(input.id);
        if (!evaluation) {
          return null;
        }
        return {
          id: evaluation.id,
          assignmentId: evaluation.assignmentId,
          candidateId: evaluation.candidateId,
          examId: evaluation.examId,
          transcriptions: evaluation.transcriptions,
          analysisResults: evaluation.analysisResults,
          overallScore: evaluation.overallScore,
          completionStatus: evaluation.completionStatus,
          failureReason: evaluation.failureReason,
          totalAnswers: evaluation.totalAnswers,
          transcribedAnswers: evaluation.transcribedAnswers,
          analyzedAnswers: evaluation.analyzedAnswers,
          processingTimeMs: evaluation.processingTimeMs,
          processedAt: evaluation.processedAt,
          completionPercentage: evaluation.getCompletionPercentage(),
          createdAt: evaluation.createdAt,
          updatedAt: evaluation.updatedAt
        };
      }
    };
  }
});

// src/use-cases/evaluations/list-evaluation-results.use-case.ts
var list_evaluation_results_use_case_exports = {};
__export(list_evaluation_results_use_case_exports, {
  ListEvaluationResultsUseCase: () => ListEvaluationResultsUseCase
});
var ListEvaluationResultsUseCase;
var init_list_evaluation_results_use_case = __esm({
  "src/use-cases/evaluations/list-evaluation-results.use-case.ts"() {
    "use strict";
    ListEvaluationResultsUseCase = class {
      constructor(evaluationResultRepository) {
        this.evaluationResultRepository = evaluationResultRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input = {}) {
        let results = [];
        if (input.examId) {
          results = await this.evaluationResultRepository.findByExamId(input.examId);
        } else if (input.candidateId) {
          results = await this.evaluationResultRepository.findByCandidateId(input.candidateId);
        } else if (input.assignmentId) {
          const result = await this.evaluationResultRepository.findByAssignmentId(input.assignmentId);
          results = result ? [result] : [];
        } else {
          throw new Error("At least one filter (examId, candidateId, or assignmentId) is required");
        }
        return {
          results: results.map((r) => ({
            id: r.id,
            assignmentId: r.assignmentId,
            candidateId: r.candidateId,
            examId: r.examId,
            transcriptions: r.transcriptions,
            analysisResults: r.analysisResults,
            overallScore: r.overallScore,
            completionStatus: r.completionStatus,
            failureReason: r.failureReason,
            totalAnswers: r.totalAnswers,
            transcribedAnswers: r.transcribedAnswers,
            analyzedAnswers: r.analyzedAnswers,
            processingTimeMs: r.processingTimeMs,
            processedAt: r.processedAt,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt
          })),
          total: results.length
        };
      }
    };
  }
});

// src/use-cases/workspaces/create-workspace.use-case.ts
var create_workspace_use_case_exports = {};
__export(create_workspace_use_case_exports, {
  CreateWorkspaceUseCase: () => CreateWorkspaceUseCase
});
import { generateId as generateId13 } from "@oxlayer/foundation-domain-kit";
var CreateWorkspaceUseCase;
var init_create_workspace_use_case = __esm({
  "src/use-cases/workspaces/create-workspace.use-case.ts"() {
    "use strict";
    CreateWorkspaceUseCase = class {
      constructor(workspaceRepository) {
        this.workspaceRepository = workspaceRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        this.validate(input);
        const id = generateId13();
        const workspace = await this.workspaceRepository.create({
          id,
          name: input.name,
          description: input.description ?? null,
          organizationId: input.organizationId,
          // Store provisioning fields if provided
          realmId: input.realmId,
          domainAliases: input.domainAliases,
          rootManagerEmail: input.rootManagerEmail
        });
        return workspace;
      }
      /**
       * Validate input
       */
      validate(input) {
        if (!input.name || input.name.trim().length === 0) {
          throw new Error("Workspace name is required");
        }
        if (input.name.length > 255) {
          throw new Error("Workspace name must be less than 255 characters");
        }
        const nameRegex = /^[a-z0-9][a-z0-9\s-]*[a-z0-9]$/;
        if (!nameRegex.test(input.name.trim())) {
          throw new Error("Workspace name must be lowercase with no special characters (hyphens and spaces allowed)");
        }
        if (input.rootManagerEmail) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(input.rootManagerEmail)) {
            throw new Error("Invalid root manager email format");
          }
        }
        if (input.domainAliases && input.domainAliases.length > 0) {
          for (const alias of input.domainAliases) {
            if (!alias || alias.trim().length === 0) {
              throw new Error("Domain alias cannot be empty");
            }
          }
        }
      }
    };
  }
});

// src/use-cases/workspaces/get-workspace.use-case.ts
var get_workspace_use_case_exports = {};
__export(get_workspace_use_case_exports, {
  GetWorkspaceUseCase: () => GetWorkspaceUseCase
});
var GetWorkspaceUseCase;
var init_get_workspace_use_case = __esm({
  "src/use-cases/workspaces/get-workspace.use-case.ts"() {
    "use strict";
    GetWorkspaceUseCase = class {
      constructor(workspaceRepository) {
        this.workspaceRepository = workspaceRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        if (!input.id) {
          throw new Error("Workspace ID is required");
        }
        const workspace = await this.workspaceRepository.findById(input.id);
        if (!workspace) {
          return null;
        }
        return workspace;
      }
    };
  }
});

// src/use-cases/workspaces/list-workspaces.use-case.ts
var list_workspaces_use_case_exports = {};
__export(list_workspaces_use_case_exports, {
  ListWorkspacesUseCase: () => ListWorkspacesUseCase
});
var ListWorkspacesUseCase;
var init_list_workspaces_use_case = __esm({
  "src/use-cases/workspaces/list-workspaces.use-case.ts"() {
    "use strict";
    ListWorkspacesUseCase = class {
      constructor(workspaceRepository) {
        this.workspaceRepository = workspaceRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input = {}) {
        const limit = input.limit ?? 50;
        const offset = input.offset ?? 0;
        if (limit > 100) {
          throw new Error("Limit cannot exceed 100");
        }
        return this.workspaceRepository.list({
          organizationId: input.organizationId,
          limit,
          offset
        });
      }
    };
  }
});

// src/use-cases/workspaces/update-workspace.use-case.ts
var update_workspace_use_case_exports = {};
__export(update_workspace_use_case_exports, {
  UpdateWorkspaceUseCase: () => UpdateWorkspaceUseCase
});
var UpdateWorkspaceUseCase;
var init_update_workspace_use_case = __esm({
  "src/use-cases/workspaces/update-workspace.use-case.ts"() {
    "use strict";
    UpdateWorkspaceUseCase = class {
      constructor(workspaceRepository) {
        this.workspaceRepository = workspaceRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        this.validate(input);
        const existing = await this.workspaceRepository.findById(input.id);
        if (!existing) {
          throw new Error("Workspace not found");
        }
        const updates = {};
        if (input.name !== void 0) {
          updates.name = input.name;
        }
        if (input.description !== void 0) {
          updates.description = input.description;
        }
        const updated = await this.workspaceRepository.update(input.id, updates);
        return updated;
      }
      /**
       * Validate input
       */
      validate(input) {
        if (!input.id) {
          throw new Error("Workspace ID is required");
        }
        if (input.name !== void 0 && input.name.length > 255) {
          throw new Error("Workspace name must be less than 255 characters");
        }
      }
    };
  }
});

// src/use-cases/workspaces/delete-workspace.use-case.ts
var delete_workspace_use_case_exports = {};
__export(delete_workspace_use_case_exports, {
  DeleteWorkspaceUseCase: () => DeleteWorkspaceUseCase
});
var DeleteWorkspaceUseCase;
var init_delete_workspace_use_case = __esm({
  "src/use-cases/workspaces/delete-workspace.use-case.ts"() {
    "use strict";
    DeleteWorkspaceUseCase = class {
      constructor(workspaceRepository) {
        this.workspaceRepository = workspaceRepository;
      }
      /**
       * Execute the use case (soft delete)
       */
      async execute(input) {
        if (!input.id) {
          throw new Error("Workspace ID is required");
        }
        const existing = await this.workspaceRepository.findById(input.id);
        if (!existing) {
          throw new Error("Workspace not found");
        }
        await this.workspaceRepository.softDelete(input.id);
      }
    };
  }
});

// src/use-cases/questions/create-question.use-case.ts
var create_question_use_case_exports = {};
__export(create_question_use_case_exports, {
  CreateQuestionUseCase: () => CreateQuestionUseCase
});
var CreateQuestionUseCase;
var init_create_question_use_case = __esm({
  "src/use-cases/questions/create-question.use-case.ts"() {
    "use strict";
    CreateQuestionUseCase = class {
      constructor(questionRepository) {
        this.questionRepository = questionRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        this.validate(input);
        const question = await this.questionRepository.create({
          examId: input.examId,
          priority: input.priority,
          text: input.text,
          type: input.type,
          weight: input.weight
        });
        return question.toPersistence();
      }
      /**
       * Validate input
       */
      validate(input) {
        if (!input.text || input.text.trim().length === 0) {
          throw new Error("Question text is required");
        }
        if (!["text", "audio"].includes(input.type)) {
          throw new Error('Question type must be "text" or "audio"');
        }
        if (!input.examId) {
          throw new Error("Exam ID is required");
        }
        if (input.priority < 1) {
          throw new Error("Priority must be at least 1");
        }
      }
    };
  }
});

// src/use-cases/questions/get-question.use-case.ts
var get_question_use_case_exports = {};
__export(get_question_use_case_exports, {
  GetQuestionUseCase: () => GetQuestionUseCase
});
var GetQuestionUseCase;
var init_get_question_use_case = __esm({
  "src/use-cases/questions/get-question.use-case.ts"() {
    "use strict";
    GetQuestionUseCase = class {
      constructor(questionRepository) {
        this.questionRepository = questionRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        if (!input.id) {
          throw new Error("Question ID is required");
        }
        const question = await this.questionRepository.findById(input.id);
        if (!question) return null;
        return question.toPersistence();
      }
    };
  }
});

// src/use-cases/questions/list-questions.use-case.ts
var list_questions_use_case_exports = {};
__export(list_questions_use_case_exports, {
  ListQuestionsUseCase: () => ListQuestionsUseCase
});
var ListQuestionsUseCase;
var init_list_questions_use_case = __esm({
  "src/use-cases/questions/list-questions.use-case.ts"() {
    "use strict";
    ListQuestionsUseCase = class {
      constructor(questionRepository) {
        this.questionRepository = questionRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input = {}) {
        const limit = input.limit ?? 50;
        const offset = input.offset ?? 0;
        if (limit > 100) {
          throw new Error("Limit cannot exceed 100");
        }
        const result = await this.questionRepository.list({
          examId: input.examId,
          type: input.type,
          limit,
          offset
        });
        return {
          questions: result.questions.map((q) => q.toPersistence()),
          total: result.total
        };
      }
    };
  }
});

// src/use-cases/questions/update-question.use-case.ts
var update_question_use_case_exports = {};
__export(update_question_use_case_exports, {
  UpdateQuestionUseCase: () => UpdateQuestionUseCase
});
var UpdateQuestionUseCase;
var init_update_question_use_case = __esm({
  "src/use-cases/questions/update-question.use-case.ts"() {
    "use strict";
    UpdateQuestionUseCase = class {
      constructor(questionRepository) {
        this.questionRepository = questionRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        this.validate(input);
        const existing = await this.questionRepository.findById(input.id);
        if (!existing) {
          throw new Error("Question not found");
        }
        const updates = {};
        if (input.priority !== void 0) updates.priority = input.priority;
        if (input.text !== void 0) updates.text = input.text;
        if (input.type !== void 0) updates.type = input.type;
        if (input.weight !== void 0) updates.weight = input.weight;
        const updated = await this.questionRepository.update(input.id, updates);
        return updated.toPersistence();
      }
      /**
       * Validate input
       */
      validate(input) {
        if (!input.id) {
          throw new Error("Question ID is required");
        }
        if (input.priority !== void 0 && input.priority < 1) {
          throw new Error("Priority must be at least 1");
        }
        if (input.type !== void 0 && !["text", "audio"].includes(input.type)) {
          throw new Error('Question type must be "text" or "audio"');
        }
      }
    };
  }
});

// src/use-cases/questions/delete-question.use-case.ts
var delete_question_use_case_exports = {};
__export(delete_question_use_case_exports, {
  DeleteQuestionUseCase: () => DeleteQuestionUseCase
});
var DeleteQuestionUseCase;
var init_delete_question_use_case = __esm({
  "src/use-cases/questions/delete-question.use-case.ts"() {
    "use strict";
    DeleteQuestionUseCase = class {
      constructor(questionRepository) {
        this.questionRepository = questionRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        if (!input.id) {
          throw new Error("Question ID is required");
        }
        const existing = await this.questionRepository.findById(input.id);
        if (!existing) {
          throw new Error("Question not found");
        }
        await this.questionRepository.delete(input.id);
      }
    };
  }
});

// src/use-cases/answers/create-answer.use-case.ts
var create_answer_use_case_exports = {};
__export(create_answer_use_case_exports, {
  CreateAnswerUseCase: () => CreateAnswerUseCase
});
import { generateId as generateId14 } from "@oxlayer/foundation-domain-kit";
var CreateAnswerUseCase;
var init_create_answer_use_case = __esm({
  "src/use-cases/answers/create-answer.use-case.ts"() {
    "use strict";
    CreateAnswerUseCase = class {
      constructor(answerRepository) {
        this.answerRepository = answerRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        this.validate(input);
        const id = generateId14();
        const answer = await this.answerRepository.create({
          ...input,
          id
        });
        return answer.toPersistence();
      }
      /**
       * Validate input
       */
      validate(input) {
        if (!input.assignmentId) {
          throw new Error("Assignment ID is required");
        }
        if (!input.candidateId) {
          throw new Error("Candidate ID is required");
        }
        if (!input.examId) {
          throw new Error("Exam ID is required");
        }
        if (!input.questionId) {
          throw new Error("Question ID is required");
        }
        if (!input.s3Url || input.s3Url.trim().length === 0) {
          throw new Error("S3 URL is required");
        }
        if (input.duration <= 0) {
          throw new Error("Duration must be greater than 0");
        }
        if (input.fileSize <= 0) {
          throw new Error("File size must be greater than 0");
        }
      }
    };
  }
});

// src/use-cases/answers/get-answer.use-case.ts
var get_answer_use_case_exports = {};
__export(get_answer_use_case_exports, {
  GetAnswerUseCase: () => GetAnswerUseCase
});
var GetAnswerUseCase;
var init_get_answer_use_case = __esm({
  "src/use-cases/answers/get-answer.use-case.ts"() {
    "use strict";
    GetAnswerUseCase = class {
      constructor(answerRepository) {
        this.answerRepository = answerRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        if (!input.id) {
          throw new Error("Answer ID is required");
        }
        const answer = await this.answerRepository.findById(input.id);
        if (!answer) return null;
        return answer.toPersistence();
      }
    };
  }
});

// src/use-cases/answers/list-answers.use-case.ts
var list_answers_use_case_exports = {};
__export(list_answers_use_case_exports, {
  ListAnswersUseCase: () => ListAnswersUseCase
});
var ListAnswersUseCase;
var init_list_answers_use_case = __esm({
  "src/use-cases/answers/list-answers.use-case.ts"() {
    "use strict";
    ListAnswersUseCase = class {
      constructor(answerRepository) {
        this.answerRepository = answerRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input = {}) {
        const limit = input.limit ?? 50;
        const offset = input.offset ?? 0;
        if (limit > 100) {
          throw new Error("Limit cannot exceed 100");
        }
        const result = await this.answerRepository.list({
          assignmentId: input.assignmentId,
          candidateId: input.candidateId,
          examId: input.examId,
          questionId: input.questionId,
          isValid: input.isValid,
          limit,
          offset
        });
        return {
          answers: result.answers.map((a) => a.toPersistence()),
          total: result.total
        };
      }
    };
  }
});

// src/use-cases/answers/update-answer.use-case.ts
var update_answer_use_case_exports = {};
__export(update_answer_use_case_exports, {
  UpdateAnswerUseCase: () => UpdateAnswerUseCase
});
var UpdateAnswerUseCase;
var init_update_answer_use_case = __esm({
  "src/use-cases/answers/update-answer.use-case.ts"() {
    "use strict";
    UpdateAnswerUseCase = class {
      constructor(answerRepository) {
        this.answerRepository = answerRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        this.validate(input);
        const existing = await this.answerRepository.findById(input.id);
        if (!existing) {
          throw new Error("Answer not found");
        }
        const updated = await this.answerRepository.update(input.id, {
          transcription: input.transcription,
          isValid: input.isValid
        });
        return updated.toPersistence();
      }
      /**
       * Validate input
       */
      validate(input) {
        if (!input.id) {
          throw new Error("Answer ID is required");
        }
        if (input.transcription !== void 0 && input.transcription === "") {
          throw new Error("Transcription cannot be empty");
        }
      }
    };
  }
});

// src/use-cases/answers/delete-answer.use-case.ts
var delete_answer_use_case_exports = {};
__export(delete_answer_use_case_exports, {
  DeleteAnswerUseCase: () => DeleteAnswerUseCase
});
var DeleteAnswerUseCase;
var init_delete_answer_use_case = __esm({
  "src/use-cases/answers/delete-answer.use-case.ts"() {
    "use strict";
    DeleteAnswerUseCase = class {
      constructor(answerRepository) {
        this.answerRepository = answerRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        if (!input.id) {
          throw new Error("Answer ID is required");
        }
        const existing = await this.answerRepository.findById(input.id);
        if (!existing) {
          throw new Error("Answer not found");
        }
        await this.answerRepository.delete(input.id);
      }
    };
  }
});

// src/use-cases/candidates/create-candidate.use-case.ts
var create_candidate_use_case_exports = {};
__export(create_candidate_use_case_exports, {
  CreateCandidateUseCase: () => CreateCandidateUseCase
});
import { generateId as generateId15 } from "@oxlayer/foundation-domain-kit";
var CreateCandidateUseCase;
var init_create_candidate_use_case = __esm({
  "src/use-cases/candidates/create-candidate.use-case.ts"() {
    "use strict";
    init_evaluations();
    CreateCandidateUseCase = class {
      constructor(candidateRepository, eventBus) {
        this.candidateRepository = candidateRepository;
        this.eventBus = eventBus;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        this.validate(input);
        const candidate = Candidate.create({
          id: generateId15(),
          workspaceId: input.workspaceId,
          name: input.name,
          email: input.email,
          cpf: input.cpf,
          externalId: input.externalId
        });
        await this.candidateRepository.create(candidate);
        await this.eventBus.publish(
          "globex.events",
          "candidate.created",
          {
            candidateId: candidate.id,
            name: candidate.name,
            workspaceId: candidate.workspaceId,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        );
        return {
          candidateId: candidate.id
        };
      }
      /**
       * Validate input
       */
      validate(input) {
        if (!input.name || input.name.trim().length === 0) {
          throw new Error("Candidate name is required");
        }
        if (input.email && !this.isValidEmail(input.email)) {
          throw new Error("Invalid email format");
        }
        if (input.cpf && !this.isValidCpf(input.cpf)) {
          throw new Error("Invalid CPF format");
        }
      }
      /**
       * Validate email format
       */
      isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      }
      /**
       * Validate CPF format (Brazilian tax ID)
       */
      isValidCpf(cpf) {
        const cleanedCpf = cpf.replace(/\D/g, "");
        return cleanedCpf.length === 11;
      }
    };
  }
});

// src/use-cases/candidates/get-candidate.use-case.ts
var get_candidate_use_case_exports = {};
__export(get_candidate_use_case_exports, {
  GetCandidateUseCase: () => GetCandidateUseCase
});
var GetCandidateUseCase;
var init_get_candidate_use_case = __esm({
  "src/use-cases/candidates/get-candidate.use-case.ts"() {
    "use strict";
    GetCandidateUseCase = class {
      constructor(candidateRepository) {
        this.candidateRepository = candidateRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        const candidate = await this.candidateRepository.findById(input.id);
        if (!candidate) {
          throw new Error("Candidate not found");
        }
        return candidate.toPersistence();
      }
    };
  }
});

// src/use-cases/candidates/list-candidates.use-case.ts
var list_candidates_use_case_exports = {};
__export(list_candidates_use_case_exports, {
  ListCandidatesUseCase: () => ListCandidatesUseCase
});
var ListCandidatesUseCase;
var init_list_candidates_use_case = __esm({
  "src/use-cases/candidates/list-candidates.use-case.ts"() {
    "use strict";
    ListCandidatesUseCase = class {
      constructor(candidateRepository) {
        this.candidateRepository = candidateRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input = {}) {
        const candidates2 = await this.candidateRepository.find({
          workspaceId: input.workspaceId
        });
        return {
          candidates: candidates2.map((c) => c.toPersistence())
        };
      }
    };
  }
});

// src/use-cases/candidates/update-candidate.use-case.ts
var update_candidate_use_case_exports = {};
__export(update_candidate_use_case_exports, {
  UpdateCandidateUseCase: () => UpdateCandidateUseCase
});
var UpdateCandidateUseCase;
var init_update_candidate_use_case = __esm({
  "src/use-cases/candidates/update-candidate.use-case.ts"() {
    "use strict";
    UpdateCandidateUseCase = class {
      constructor(candidateRepository, eventBus) {
        this.candidateRepository = candidateRepository;
        this.eventBus = eventBus;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        const existing = await this.candidateRepository.findById(input.id);
        if (!existing) {
          throw new Error("Candidate not found");
        }
        if (input.email && !this.isValidEmail(input.email)) {
          throw new Error("Invalid email format");
        }
        if (input.cpf && !this.isValidCpf(input.cpf)) {
          throw new Error("Invalid CPF format");
        }
        const updated = await this.candidateRepository.update(input.id, {
          name: input.name,
          email: input.email,
          cpf: input.cpf,
          externalId: input.externalId
        });
        await this.eventBus.publish(
          "globex.events",
          "candidate.updated",
          {
            candidateId: updated.id,
            name: updated.name,
            workspaceId: updated.workspaceId,
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        );
        return updated.toPersistence();
      }
      /**
       * Validate email format
       */
      isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      }
      /**
       * Validate CPF format (Brazilian tax ID)
       */
      isValidCpf(cpf) {
        const cleanedCpf = cpf.replace(/\D/g, "");
        return cleanedCpf.length === 11;
      }
    };
  }
});

// src/use-cases/candidates/delete-candidate.use-case.ts
var delete_candidate_use_case_exports = {};
__export(delete_candidate_use_case_exports, {
  DeleteCandidateUseCase: () => DeleteCandidateUseCase
});
var DeleteCandidateUseCase;
var init_delete_candidate_use_case = __esm({
  "src/use-cases/candidates/delete-candidate.use-case.ts"() {
    "use strict";
    DeleteCandidateUseCase = class {
      constructor(candidateRepository, eventBus) {
        this.candidateRepository = candidateRepository;
        this.eventBus = eventBus;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        const existing = await this.candidateRepository.findById(input.id);
        if (!existing) {
          throw new Error("Candidate not found");
        }
        await this.candidateRepository.delete(input.id);
        await this.eventBus.publish(
          "globex.events",
          "candidate.deleted",
          {
            candidateId: input.id,
            workspaceId: existing.workspaceId,
            deletedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        );
      }
    };
  }
});

// src/use-cases/tags/create-tag.use-case.ts
var create_tag_use_case_exports = {};
__export(create_tag_use_case_exports, {
  CreateTagUseCase: () => CreateTagUseCase
});
import { generateId as generateId16 } from "@oxlayer/foundation-domain-kit";
var CreateTagUseCase;
var init_create_tag_use_case = __esm({
  "src/use-cases/tags/create-tag.use-case.ts"() {
    "use strict";
    CreateTagUseCase = class {
      constructor(tagRepository, eventBus) {
        this.tagRepository = tagRepository;
        this.eventBus = eventBus;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        this.validate(input);
        const existing = await this.tagRepository.findByWorkspaceKeyAndValue(
          input.workspaceId,
          input.key,
          input.value
        );
        if (existing) {
          throw new Error("Tag with this key and value already exists");
        }
        const { Tag: Tag2 } = await Promise.resolve().then(() => (init_tags(), tags_exports));
        const tag = Tag2.create({
          id: generateId16(),
          workspaceId: input.workspaceId,
          key: input.key,
          value: input.value,
          isPrimary: input.isPrimary,
          description: input.description,
          color: input.color
        });
        await this.tagRepository.create(tag);
        await this.eventBus.publish(
          "globex.events",
          "tag.created",
          {
            tagId: tag.id,
            key: tag.key,
            value: tag.value,
            workspaceId: tag.workspaceId,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        );
        return {
          tagId: tag.id
        };
      }
      /**
       * Validate input
       */
      validate(input) {
        if (!input.key || input.key.trim().length === 0) {
          throw new Error("Tag key is required");
        }
        if (input.key.length > 100) {
          throw new Error("Tag key must be less than 100 characters");
        }
        if (!input.value || input.value.trim().length === 0) {
          throw new Error("Tag value is required");
        }
        if (input.value.length > 255) {
          throw new Error("Tag value must be less than 255 characters");
        }
        if (input.color && !/^#[0-9A-F]{6}$/i.test(input.color)) {
          throw new Error("Tag color must be a valid hex color code");
        }
      }
    };
  }
});

// src/use-cases/tags/get-tag.use-case.ts
var get_tag_use_case_exports = {};
__export(get_tag_use_case_exports, {
  GetTagUseCase: () => GetTagUseCase
});
var GetTagUseCase;
var init_get_tag_use_case = __esm({
  "src/use-cases/tags/get-tag.use-case.ts"() {
    "use strict";
    GetTagUseCase = class {
      constructor(tagRepository) {
        this.tagRepository = tagRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        const tag = await this.tagRepository.findById(input.id);
        if (!tag) {
          throw new Error("Tag not found");
        }
        return {
          tag: {
            id: tag.id,
            workspaceId: tag.workspaceId,
            key: tag.key,
            value: tag.value,
            isPrimary: tag.isPrimary,
            description: tag.description,
            color: tag.color,
            createdAt: tag.createdAt,
            updatedAt: tag.updatedAt
          }
        };
      }
    };
  }
});

// src/use-cases/tags/list-tags.use-case.ts
var list_tags_use_case_exports = {};
__export(list_tags_use_case_exports, {
  ListTagsUseCase: () => ListTagsUseCase
});
var ListTagsUseCase;
var init_list_tags_use_case = __esm({
  "src/use-cases/tags/list-tags.use-case.ts"() {
    "use strict";
    ListTagsUseCase = class {
      constructor(tagRepository) {
        this.tagRepository = tagRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        const tags2 = await this.tagRepository.find({
          workspaceId: input.workspaceId,
          key: input.key,
          value: input.value,
          isPrimary: input.isPrimary
        });
        return {
          tags: tags2.map((tag) => ({
            id: tag.id,
            workspaceId: tag.workspaceId,
            key: tag.key,
            value: tag.value,
            isPrimary: tag.isPrimary,
            description: tag.description,
            color: tag.color,
            createdAt: tag.createdAt,
            updatedAt: tag.updatedAt
          }))
        };
      }
    };
  }
});

// src/use-cases/tags/update-tag.use-case.ts
var update_tag_use_case_exports = {};
__export(update_tag_use_case_exports, {
  UpdateTagUseCase: () => UpdateTagUseCase
});
var UpdateTagUseCase;
var init_update_tag_use_case = __esm({
  "src/use-cases/tags/update-tag.use-case.ts"() {
    "use strict";
    UpdateTagUseCase = class {
      constructor(tagRepository, eventBus) {
        this.tagRepository = tagRepository;
        this.eventBus = eventBus;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        this.validate(input);
        const existing = await this.tagRepository.findById(input.id);
        if (!existing) {
          throw new Error("Tag not found");
        }
        if (input.key || input.value) {
          const newKey = input.key ?? existing.key;
          const newValue = input.value ?? existing.value;
          const duplicate = await this.tagRepository.findByWorkspaceKeyAndValue(
            existing.workspaceId,
            newKey,
            newValue
          );
          if (duplicate && duplicate.id !== input.id) {
            throw new Error("Tag with this key and value already exists");
          }
        }
        const tag = await this.tagRepository.update(input.id, {
          key: input.key,
          value: input.value,
          isPrimary: input.isPrimary,
          description: input.description,
          color: input.color
        });
        await this.eventBus.publish(
          "globex.events",
          "tag.updated",
          {
            tagId: tag.id,
            key: tag.key,
            value: tag.value,
            workspaceId: tag.workspaceId,
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        );
        return {
          tag: {
            id: tag.id,
            workspaceId: tag.workspaceId,
            key: tag.key,
            value: tag.value,
            isPrimary: tag.isPrimary,
            description: tag.description,
            color: tag.color,
            createdAt: tag.createdAt,
            updatedAt: tag.updatedAt
          }
        };
      }
      /**
       * Validate input
       */
      validate(input) {
        if (input.key !== void 0) {
          if (input.key.trim().length === 0) {
            throw new Error("Tag key cannot be empty");
          }
          if (input.key.length > 100) {
            throw new Error("Tag key must be less than 100 characters");
          }
        }
        if (input.value !== void 0) {
          if (input.value.trim().length === 0) {
            throw new Error("Tag value cannot be empty");
          }
          if (input.value.length > 255) {
            throw new Error("Tag value must be less than 255 characters");
          }
        }
        if (input.color && !/^#[0-9A-F]{6}$/i.test(input.color)) {
          throw new Error("Tag color must be a valid hex color code");
        }
      }
    };
  }
});

// src/use-cases/tags/delete-tag.use-case.ts
var delete_tag_use_case_exports = {};
__export(delete_tag_use_case_exports, {
  DeleteTagUseCase: () => DeleteTagUseCase
});
var DeleteTagUseCase;
var init_delete_tag_use_case = __esm({
  "src/use-cases/tags/delete-tag.use-case.ts"() {
    "use strict";
    DeleteTagUseCase = class {
      constructor(tagRepository, eventBus) {
        this.tagRepository = tagRepository;
        this.eventBus = eventBus;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        const tag = await this.tagRepository.findById(input.id);
        if (!tag) {
          throw new Error("Tag not found");
        }
        await this.tagRepository.delete(input.id);
        await this.eventBus.publish(
          "globex.events",
          "tag.deleted",
          {
            tagId: tag.id,
            key: tag.key,
            value: tag.value,
            workspaceId: tag.workspaceId,
            deletedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        );
        return {
          success: true
        };
      }
    };
  }
});

// src/use-cases/templates/create-template.use-case.ts
var create_template_use_case_exports = {};
__export(create_template_use_case_exports, {
  CreateTemplateUseCase: () => CreateTemplateUseCase
});
import { generateId as generateId17 } from "@oxlayer/foundation-domain-kit";
var CreateTemplateUseCase;
var init_create_template_use_case = __esm({
  "src/use-cases/templates/create-template.use-case.ts"() {
    "use strict";
    CreateTemplateUseCase = class {
      constructor(templateRepository, eventBus) {
        this.templateRepository = templateRepository;
        this.eventBus = eventBus;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        this.validate(input);
        const { Template: Template2 } = await Promise.resolve().then(() => (init_templates(), templates_exports));
        const template = Template2.create({
          id: generateId17(),
          workspaceId: input.workspaceId,
          name: input.name,
          type: input.type,
          subject: input.subject,
          body: input.body,
          variables: input.variables,
          category: input.category,
          language: input.language,
          isActive: input.isActive,
          externalId: input.externalId,
          status: input.status
        });
        await this.templateRepository.create(template);
        await this.eventBus.publish(
          "globex.events",
          "template.created",
          {
            templateId: template.id,
            name: template.name,
            type: template.type,
            workspaceId: template.workspaceId,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        );
        return {
          templateId: template.id
        };
      }
      /**
       * Validate input
       */
      validate(input) {
        if (!input.name || input.name.trim().length === 0) {
          throw new Error("Template name is required");
        }
        if (input.name.length > 255) {
          throw new Error("Template name must be less than 255 characters");
        }
        if (!input.body || input.body.trim().length === 0) {
          throw new Error("Template body is required");
        }
        if (!["whatsapp", "email", "sms"].includes(input.type)) {
          throw new Error("Template type must be one of: whatsapp, email, sms");
        }
        if (input.type === "email" && !input.subject) {
          throw new Error("Subject is required for email templates");
        }
      }
    };
  }
});

// src/use-cases/templates/get-template.use-case.ts
var get_template_use_case_exports = {};
__export(get_template_use_case_exports, {
  GetTemplateUseCase: () => GetTemplateUseCase
});
var GetTemplateUseCase;
var init_get_template_use_case = __esm({
  "src/use-cases/templates/get-template.use-case.ts"() {
    "use strict";
    GetTemplateUseCase = class {
      constructor(templateRepository) {
        this.templateRepository = templateRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        const template = await this.templateRepository.findById(input.id);
        if (!template) {
          throw new Error("Template not found");
        }
        return {
          template: {
            id: template.id,
            workspaceId: template.workspaceId,
            name: template.name,
            type: template.type,
            subject: template.subject,
            body: template.body,
            variables: template.variables,
            category: template.category,
            language: template.language,
            isActive: template.isActive,
            externalId: template.externalId,
            status: template.status,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt
          }
        };
      }
    };
  }
});

// src/use-cases/templates/list-templates.use-case.ts
var list_templates_use_case_exports = {};
__export(list_templates_use_case_exports, {
  ListTemplatesUseCase: () => ListTemplatesUseCase
});
var ListTemplatesUseCase;
var init_list_templates_use_case = __esm({
  "src/use-cases/templates/list-templates.use-case.ts"() {
    "use strict";
    ListTemplatesUseCase = class {
      constructor(templateRepository) {
        this.templateRepository = templateRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        const templates2 = await this.templateRepository.find({
          workspaceId: input.workspaceId,
          type: input.type,
          category: input.category,
          status: input.status,
          isActive: input.isActive
        });
        return {
          templates: templates2.map((template) => ({
            id: template.id,
            workspaceId: template.workspaceId,
            name: template.name,
            type: template.type,
            subject: template.subject,
            body: template.body,
            variables: template.variables,
            category: template.category,
            language: template.language,
            isActive: template.isActive,
            externalId: template.externalId,
            status: template.status,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt
          }))
        };
      }
    };
  }
});

// src/use-cases/templates/update-template.use-case.ts
var update_template_use_case_exports = {};
__export(update_template_use_case_exports, {
  UpdateTemplateUseCase: () => UpdateTemplateUseCase
});
var UpdateTemplateUseCase;
var init_update_template_use_case = __esm({
  "src/use-cases/templates/update-template.use-case.ts"() {
    "use strict";
    UpdateTemplateUseCase = class {
      constructor(templateRepository, eventBus) {
        this.templateRepository = templateRepository;
        this.eventBus = eventBus;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        this.validate(input);
        const existing = await this.templateRepository.findById(input.id);
        if (!existing) {
          throw new Error("Template not found");
        }
        const template = await this.templateRepository.update(input.id, {
          name: input.name,
          type: input.type,
          subject: input.subject,
          body: input.body,
          variables: input.variables,
          category: input.category,
          language: input.language,
          isActive: input.isActive,
          externalId: input.externalId,
          status: input.status
        });
        await this.eventBus.publish(
          "globex.events",
          "template.updated",
          {
            templateId: template.id,
            name: template.name,
            type: template.type,
            workspaceId: template.workspaceId,
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        );
        return {
          template: {
            id: template.id,
            workspaceId: template.workspaceId,
            name: template.name,
            type: template.type,
            subject: template.subject,
            body: template.body,
            variables: template.variables,
            category: template.category,
            language: template.language,
            isActive: template.isActive,
            externalId: template.externalId,
            status: template.status,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt
          }
        };
      }
      /**
       * Validate input
       */
      validate(input) {
        if (input.name !== void 0) {
          if (input.name.trim().length === 0) {
            throw new Error("Template name cannot be empty");
          }
          if (input.name.length > 255) {
            throw new Error("Template name must be less than 255 characters");
          }
        }
        if (input.body !== void 0 && input.body.trim().length === 0) {
          throw new Error("Template body cannot be empty");
        }
        if (input.type && !["whatsapp", "email", "sms"].includes(input.type)) {
          throw new Error("Template type must be one of: whatsapp, email, sms");
        }
      }
    };
  }
});

// src/use-cases/templates/delete-template.use-case.ts
var delete_template_use_case_exports = {};
__export(delete_template_use_case_exports, {
  DeleteTemplateUseCase: () => DeleteTemplateUseCase
});
var DeleteTemplateUseCase;
var init_delete_template_use_case = __esm({
  "src/use-cases/templates/delete-template.use-case.ts"() {
    "use strict";
    DeleteTemplateUseCase = class {
      constructor(templateRepository, eventBus) {
        this.templateRepository = templateRepository;
        this.eventBus = eventBus;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        const template = await this.templateRepository.findById(input.id);
        if (!template) {
          throw new Error("Template not found");
        }
        await this.templateRepository.delete(input.id);
        await this.eventBus.publish(
          "globex.events",
          "template.deleted",
          {
            templateId: template.id,
            name: template.name,
            type: template.type,
            workspaceId: template.workspaceId,
            deletedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        );
        return {
          success: true
        };
      }
    };
  }
});

// src/use-cases/campaigns/create-whatsapp-campaign.use-case.ts
var create_whatsapp_campaign_use_case_exports = {};
__export(create_whatsapp_campaign_use_case_exports, {
  CreateWhatsAppCampaignUseCase: () => CreateWhatsAppCampaignUseCase
});
import { generateId as generateId18 } from "@oxlayer/foundation-domain-kit";
var CreateWhatsAppCampaignUseCase;
var init_create_whatsapp_campaign_use_case = __esm({
  "src/use-cases/campaigns/create-whatsapp-campaign.use-case.ts"() {
    "use strict";
    CreateWhatsAppCampaignUseCase = class {
      constructor(campaignRepository, templateRepository, eventBus) {
        this.campaignRepository = campaignRepository;
        this.templateRepository = templateRepository;
        this.eventBus = eventBus;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        await this.validate(input);
        const { WhatsAppCampaign: WhatsAppCampaign2 } = await Promise.resolve().then(() => (init_campaigns(), campaigns_exports));
        const campaign = WhatsAppCampaign2.create({
          id: generateId18(),
          workspaceId: input.workspaceId,
          examId: input.examId,
          templateId: input.templateId,
          name: input.name,
          description: input.description,
          scheduledAt: input.scheduledAt,
          tags: input.tags
        });
        await this.campaignRepository.create(campaign);
        await this.eventBus.publish(
          "globex.events",
          "whatsapp_campaign.created",
          {
            campaignId: campaign.id,
            name: campaign.name,
            templateId: campaign.templateId,
            workspaceId: campaign.workspaceId,
            scheduledAt: campaign.scheduledAt?.toISOString(),
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        );
        return {
          campaignId: campaign.id
        };
      }
      /**
       * Validate input
       */
      async validate(input) {
        if (!input.name || input.name.trim().length === 0) {
          throw new Error("Campaign name is required");
        }
        if (input.name.length > 255) {
          throw new Error("Campaign name must be less than 255 characters");
        }
        if (!input.templateId) {
          throw new Error("Template ID is required");
        }
        const template = await this.templateRepository.findById(input.templateId);
        if (!template) {
          throw new Error("Template not found");
        }
        if (!template.isReady()) {
          throw new Error("Template is not ready for use (must be active and approved)");
        }
      }
    };
  }
});

// src/use-cases/campaigns/get-whatsapp-campaign.use-case.ts
var get_whatsapp_campaign_use_case_exports = {};
__export(get_whatsapp_campaign_use_case_exports, {
  GetWhatsAppCampaignUseCase: () => GetWhatsAppCampaignUseCase
});
var GetWhatsAppCampaignUseCase;
var init_get_whatsapp_campaign_use_case = __esm({
  "src/use-cases/campaigns/get-whatsapp-campaign.use-case.ts"() {
    "use strict";
    GetWhatsAppCampaignUseCase = class {
      constructor(campaignRepository) {
        this.campaignRepository = campaignRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        const campaign = await this.campaignRepository.findById(input.id);
        if (!campaign) {
          throw new Error("Campaign not found");
        }
        return {
          campaign: {
            id: campaign.id,
            workspaceId: campaign.workspaceId,
            examId: campaign.examId,
            templateId: campaign.templateId,
            name: campaign.name,
            description: campaign.description,
            status: campaign.status,
            scheduledAt: campaign.scheduledAt,
            startedAt: campaign.startedAt,
            completedAt: campaign.completedAt,
            totalRecipients: campaign.totalRecipients,
            sentCount: campaign.sentCount,
            deliveredCount: campaign.deliveredCount,
            failedCount: campaign.failedCount,
            tags: campaign.tags,
            createdAt: campaign.createdAt,
            updatedAt: campaign.updatedAt
          }
        };
      }
    };
  }
});

// src/use-cases/campaigns/list-whatsapp-campaigns.use-case.ts
var list_whatsapp_campaigns_use_case_exports = {};
__export(list_whatsapp_campaigns_use_case_exports, {
  ListWhatsAppCampaignsUseCase: () => ListWhatsAppCampaignsUseCase
});
var ListWhatsAppCampaignsUseCase;
var init_list_whatsapp_campaigns_use_case = __esm({
  "src/use-cases/campaigns/list-whatsapp-campaigns.use-case.ts"() {
    "use strict";
    ListWhatsAppCampaignsUseCase = class {
      constructor(campaignRepository) {
        this.campaignRepository = campaignRepository;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        const campaigns = await this.campaignRepository.find({
          workspaceId: input.workspaceId,
          examId: input.examId,
          templateId: input.templateId,
          status: input.status
        });
        return {
          campaigns: campaigns.map((campaign) => ({
            id: campaign.id,
            workspaceId: campaign.workspaceId,
            examId: campaign.examId,
            templateId: campaign.templateId,
            name: campaign.name,
            description: campaign.description,
            status: campaign.status,
            scheduledAt: campaign.scheduledAt,
            startedAt: campaign.startedAt,
            completedAt: campaign.completedAt,
            totalRecipients: campaign.totalRecipients,
            sentCount: campaign.sentCount,
            deliveredCount: campaign.deliveredCount,
            failedCount: campaign.failedCount,
            tags: campaign.tags,
            createdAt: campaign.createdAt,
            updatedAt: campaign.updatedAt
          }))
        };
      }
    };
  }
});

// src/use-cases/campaigns/update-whatsapp-campaign.use-case.ts
var update_whatsapp_campaign_use_case_exports = {};
__export(update_whatsapp_campaign_use_case_exports, {
  UpdateWhatsAppCampaignUseCase: () => UpdateWhatsAppCampaignUseCase
});
var UpdateWhatsAppCampaignUseCase;
var init_update_whatsapp_campaign_use_case = __esm({
  "src/use-cases/campaigns/update-whatsapp-campaign.use-case.ts"() {
    "use strict";
    UpdateWhatsAppCampaignUseCase = class {
      constructor(campaignRepository, templateRepository, eventBus) {
        this.campaignRepository = campaignRepository;
        this.templateRepository = templateRepository;
        this.eventBus = eventBus;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        await this.validate(input);
        const existing = await this.campaignRepository.findById(input.id);
        if (!existing) {
          throw new Error("Campaign not found");
        }
        if (existing.isFinished()) {
          throw new Error("Cannot update a finished campaign");
        }
        const campaign = await this.campaignRepository.update(input.id, {
          name: input.name,
          description: input.description,
          templateId: input.templateId,
          scheduledAt: input.scheduledAt,
          tags: input.tags
        });
        await this.eventBus.publish(
          "globex.events",
          "whatsapp_campaign.updated",
          {
            campaignId: campaign.id,
            name: campaign.name,
            templateId: campaign.templateId,
            workspaceId: campaign.workspaceId,
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        );
        return {
          campaign: {
            id: campaign.id,
            workspaceId: campaign.workspaceId,
            examId: campaign.examId,
            templateId: campaign.templateId,
            name: campaign.name,
            description: campaign.description,
            status: campaign.status,
            scheduledAt: campaign.scheduledAt,
            startedAt: campaign.startedAt,
            completedAt: campaign.completedAt,
            totalRecipients: campaign.totalRecipients,
            sentCount: campaign.sentCount,
            deliveredCount: campaign.deliveredCount,
            failedCount: campaign.failedCount,
            tags: campaign.tags,
            createdAt: campaign.createdAt,
            updatedAt: campaign.updatedAt
          }
        };
      }
      /**
       * Validate input
       */
      async validate(input) {
        if (input.name !== void 0) {
          if (input.name.trim().length === 0) {
            throw new Error("Campaign name cannot be empty");
          }
          if (input.name.length > 255) {
            throw new Error("Campaign name must be less than 255 characters");
          }
        }
        if (input.templateId) {
          const template = await this.templateRepository.findById(input.templateId);
          if (!template) {
            throw new Error("Template not found");
          }
          if (!template.isReady()) {
            throw new Error("Template is not ready for use (must be active and approved)");
          }
        }
      }
    };
  }
});

// src/use-cases/campaigns/delete-whatsapp-campaign.use-case.ts
var delete_whatsapp_campaign_use_case_exports = {};
__export(delete_whatsapp_campaign_use_case_exports, {
  DeleteWhatsAppCampaignUseCase: () => DeleteWhatsAppCampaignUseCase
});
var DeleteWhatsAppCampaignUseCase;
var init_delete_whatsapp_campaign_use_case = __esm({
  "src/use-cases/campaigns/delete-whatsapp-campaign.use-case.ts"() {
    "use strict";
    DeleteWhatsAppCampaignUseCase = class {
      constructor(campaignRepository, eventBus) {
        this.campaignRepository = campaignRepository;
        this.eventBus = eventBus;
      }
      /**
       * Execute the use case
       */
      async execute(input) {
        const campaign = await this.campaignRepository.findById(input.id);
        if (!campaign) {
          throw new Error("Campaign not found");
        }
        if (campaign.status === "sending" || campaign.status === "sent") {
          throw new Error("Cannot delete a campaign that is being sent or has been sent");
        }
        await this.campaignRepository.delete(input.id);
        await this.eventBus.publish(
          "globex.events",
          "whatsapp_campaign.deleted",
          {
            campaignId: campaign.id,
            name: campaign.name,
            workspaceId: campaign.workspaceId,
            deletedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        );
        return {
          success: true
        };
      }
    };
  }
});

// src/controllers/exams/exams.controller.ts
var exams_controller_exports = {};
__export(exams_controller_exports, {
  ExamsController: () => ExamsController
});
import { BaseController } from "@oxlayer/foundation-http-kit";
import { z as z2 } from "zod";
var createExamSchema, listExamsQuerySchema, updateExamSchema, ExamsController;
var init_exams_controller = __esm({
  "src/controllers/exams/exams.controller.ts"() {
    "use strict";
    createExamSchema = z2.object({
      workspaceId: z2.string().uuid().describe("Workspace ID"),
      examName: z2.string().min(1).describe("Exam name"),
      durationMinutes: z2.number().int().min(1).max(120).optional().describe("Duration in minutes"),
      questions: z2.array(
        z2.object({
          priority: z2.number().describe("Question priority/order"),
          text: z2.string().describe("Question text"),
          type: z2.enum(["text", "audio"]).describe("Question type")
        })
      ).min(1).describe("Array of questions")
    });
    listExamsQuerySchema = z2.object({
      workspaceId: z2.string().uuid().optional().describe("Filter by workspace ID")
    });
    updateExamSchema = z2.object({
      examName: z2.string().min(1).optional().describe("Exam name"),
      durationMinutes: z2.number().int().min(1).max(120).optional().describe("Duration in minutes")
    });
    ExamsController = class extends BaseController {
      constructor(createExamUseCase, getExamUseCase, listExamsUseCase, deleteExamUseCase, updateExamUseCase) {
        super();
        this.createExamUseCase = createExamUseCase;
        this.getExamUseCase = getExamUseCase;
        this.listExamsUseCase = listExamsUseCase;
        this.deleteExamUseCase = deleteExamUseCase;
        this.updateExamUseCase = updateExamUseCase;
      }
      /**
       * POST /api/exams - Create a new exam
       */
      async create(c) {
        try {
          const body = await c.req.json();
          const input = createExamSchema.safeParse(body);
          if (!input.success) {
            return this.validationError(input.error.flatten().fieldErrors);
          }
          const result = await this.createExamUseCase.execute(input.data);
          return this.created({
            message: "Exam created successfully",
            examId: result.examId,
            questionIds: result.questionIds
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/exams/:id - Get exam by ID
       */
      async getById(c) {
        try {
          const id = c.req.param("id");
          if (!id || !z2.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid exam ID");
          }
          const exam = await this.getExamUseCase.execute({ id });
          if (!exam) {
            return this.notFound("Exam not found");
          }
          return this.ok({
            message: "Exam retrieved successfully",
            exam
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/exams/:id/questions - Get exam with questions
       */
      async getWithQuestions(c) {
        try {
          const id = c.req.param("id");
          if (!id || !z2.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid exam ID");
          }
          const result = await this.getExamUseCase.execute({ id });
          if (!result) {
            return this.notFound("Exam not found");
          }
          return this.ok({
            message: "Exam retrieved successfully",
            examId: result.id,
            examName: result.examName,
            durationMinutes: result.durationMinutes,
            questions: result.questions
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/exams - List exams
       */
      async list(c) {
        try {
          const query = listExamsQuerySchema.safeParse(c.req.query());
          if (!query.success) {
            return this.validationError(query.error.flatten().fieldErrors);
          }
          const exams2 = await this.listExamsUseCase.execute({
            workspaceId: query.data.workspaceId
          });
          return c.json(exams2);
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * DELETE /api/exams/:id - Delete an exam
       */
      async delete(c) {
        try {
          const id = c.req.param("id");
          if (!id || !z2.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid exam ID");
          }
          const result = await this.deleteExamUseCase.execute({ id });
          return this.ok({
            message: "Exam deleted successfully",
            exam: result
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * PATCH /api/exams/:id - Update an exam
       */
      async update(c) {
        try {
          const id = c.req.param("id");
          const body = await c.req.json();
          const input = updateExamSchema.safeParse(body);
          if (!id || !z2.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid exam ID");
          }
          if (!input.success) {
            return this.validationError(input.error.flatten().fieldErrors);
          }
          const result = await this.updateExamUseCase.execute({
            id,
            ...input.data
          });
          return this.ok({
            message: "Exam updated successfully",
            exam: result
          });
        } catch (error) {
          return this.error(error);
        }
      }
    };
  }
});

// src/controllers/evaluations/evaluations.controller.ts
var evaluations_controller_exports = {};
__export(evaluations_controller_exports, {
  EvaluationsController: () => EvaluationsController
});
import { BaseController as BaseController2 } from "@oxlayer/foundation-http-kit";
import { z as z3 } from "zod";
var bulkEvaluateSchema, getByExamCpfSchema, EvaluationsController;
var init_evaluations_controller = __esm({
  "src/controllers/evaluations/evaluations.controller.ts"() {
    "use strict";
    bulkEvaluateSchema = z3.object({
      exam_id: z3.string().uuid().describe("Exam ID"),
      users: z3.array(
        z3.object({
          user_id: z3.string().uuid().describe("User ID"),
          cpf: z3.string().optional().describe("User CPF"),
          name: z3.string().optional().describe("User name"),
          email: z3.string().email().optional().describe("User email"),
          externalId: z3.string().optional().describe("External ID")
        })
      ).min(1).describe("Array of users to evaluate")
    });
    getByExamCpfSchema = z3.object({
      exam_id: z3.string().uuid().describe("Exam ID"),
      cpf: z3.string().describe("User CPF")
    });
    EvaluationsController = class extends BaseController2 {
      constructor(assignExamUseCase, bulkEvaluateUseCase, getEvaluationUseCase, listEvaluationResultsUseCase) {
        super();
        this.assignExamUseCase = assignExamUseCase;
        this.bulkEvaluateUseCase = bulkEvaluateUseCase;
        this.getEvaluationUseCase = getEvaluationUseCase;
        this.listEvaluationResultsUseCase = listEvaluationResultsUseCase;
      }
      /**
       * POST /api/evaluations/bulk - Bulk evaluate users for an exam
       */
      async bulkEvaluate(c) {
        try {
          const workspaceId = c.req.header("x-workspace-id");
          const body = await c.req.json();
          const input = bulkEvaluateSchema.safeParse(body);
          if (!input.success) {
            return this.validationError(input.error.flatten().fieldErrors);
          }
          const result = await this.bulkEvaluateUseCase.execute({
            examId: input.data.exam_id,
            users: input.data.users,
            workspaceId: workspaceId || input.data.exam_id
            // Fallback to exam_id
          });
          return this.ok(result);
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/evaluations/:id - Get evaluation by ID
       */
      async getById(c) {
        try {
          const id = c.req.param("id");
          if (!id || !z3.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid evaluation ID");
          }
          const evaluation = await this.getEvaluationUseCase.execute({ id });
          if (!evaluation) {
            return this.notFound("Evaluation not found");
          }
          return this.ok({ evaluation });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/evaluations/by-exam-cpf - Get evaluation by exam and CPF
       */
      async getByExamAndCpf(c) {
        try {
          const query = getByExamCpfSchema.safeParse(c.req.query());
          if (!query.success) {
            return this.validationError(query.error.flatten().fieldErrors);
          }
          return this.badRequest("Not implemented yet");
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/evaluations/results - List evaluation results with filters
       */
      async list(c) {
        try {
          const examId = c.req.query("examId");
          const candidateId = c.req.query("candidateId");
          const assignmentId = c.req.query("assignmentId");
          const result = await this.listEvaluationResultsUseCase.execute({
            examId,
            candidateId,
            assignmentId
          });
          return this.ok({
            results: result.results,
            total: result.total
          });
        } catch (error) {
          return this.error(error);
        }
      }
    };
  }
});

// src/controllers/workspaces/workspaces.controller.ts
var workspaces_controller_exports = {};
__export(workspaces_controller_exports, {
  WorkspacesController: () => WorkspacesController
});
import { BaseController as BaseController3 } from "@oxlayer/foundation-http-kit";
import { z as z4 } from "zod";
var createWorkspaceSchema, updateWorkspaceSchema, listWorkspacesQuerySchema, WorkspacesController;
var init_workspaces_controller = __esm({
  "src/controllers/workspaces/workspaces.controller.ts"() {
    "use strict";
    createWorkspaceSchema = z4.object({
      name: z4.string().min(1).max(255).regex(/^[a-z0-9][a-z0-9\s-]*[a-z0-9]$/, "Workspace name must be lowercase with no special characters (hyphens and spaces allowed)").describe("Workspace name"),
      description: z4.string().optional().describe("Workspace description"),
      organizationId: z4.string().uuid().optional().describe("Organization ID (optional - workspace can be at realm level)"),
      // Provisioning fields (optional - if provided, will provision database)
      realmId: z4.string().optional().describe("Realm ID for database provisioning"),
      domainAliases: z4.array(z4.string()).optional().describe("Custom domain aliases"),
      rootManagerEmail: z4.string().email().optional().describe("Root manager/owner email")
    });
    updateWorkspaceSchema = z4.object({
      name: z4.string().min(1).max(255).optional().describe("Workspace name"),
      description: z4.string().optional().describe("Workspace description")
    });
    listWorkspacesQuerySchema = z4.object({
      organizationId: z4.string().uuid().optional().describe("Filter by organization ID"),
      limit: z4.string().transform(Number).optional().describe("Limit results"),
      offset: z4.string().transform(Number).optional().describe("Offset results")
    });
    WorkspacesController = class extends BaseController3 {
      constructor(createWorkspaceUseCase, getWorkspaceUseCase, listWorkspacesUseCase, updateWorkspaceUseCase, deleteWorkspaceUseCase) {
        super();
        this.createWorkspaceUseCase = createWorkspaceUseCase;
        this.getWorkspaceUseCase = getWorkspaceUseCase;
        this.listWorkspacesUseCase = listWorkspacesUseCase;
        this.updateWorkspaceUseCase = updateWorkspaceUseCase;
        this.deleteWorkspaceUseCase = deleteWorkspaceUseCase;
      }
      /**
       * POST /api/workspaces - Create a new workspace
       */
      async create(c) {
        try {
          const body = await c.req.json();
          const input = createWorkspaceSchema.safeParse(body);
          if (!input.success) {
            return this.validationError(input.error.flatten().fieldErrors);
          }
          const result = await this.createWorkspaceUseCase.execute(input.data);
          return this.created({
            message: "Workspace created successfully",
            workspace: result
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/workspaces/:id - Get workspace by ID
       */
      async getById(c) {
        try {
          const id = c.req.param("id");
          if (!id || !z4.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid workspace ID");
          }
          const workspace = await this.getWorkspaceUseCase.execute({ id });
          if (!workspace) {
            return this.notFound("Workspace not found");
          }
          return this.ok({
            message: "Workspace retrieved successfully",
            workspace
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/workspaces - List workspaces
       */
      async list(c) {
        try {
          const query = listWorkspacesQuerySchema.safeParse(c.req.query());
          if (!query.success) {
            return this.validationError(query.error.flatten().fieldErrors);
          }
          const result = await this.listWorkspacesUseCase.execute({
            organizationId: query.data.organizationId,
            limit: query.data.limit,
            offset: query.data.offset
          });
          return c.json(result.workspaces);
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * PATCH /api/workspaces/:id - Update a workspace
       */
      async update(c) {
        try {
          const id = c.req.param("id");
          const body = await c.req.json();
          const input = updateWorkspaceSchema.safeParse(body);
          if (!id || !z4.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid workspace ID");
          }
          if (!input.success) {
            return this.validationError(input.error.flatten().fieldErrors);
          }
          const result = await this.updateWorkspaceUseCase.execute({
            id,
            ...input.data
          });
          return this.ok({
            message: "Workspace updated successfully",
            workspace: result
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * DELETE /api/workspaces/:id - Delete a workspace (soft delete)
       */
      async delete(c) {
        try {
          const id = c.req.param("id");
          if (!id || !z4.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid workspace ID");
          }
          await this.deleteWorkspaceUseCase.execute({ id });
          return this.ok({
            message: "Workspace deleted successfully"
          });
        } catch (error) {
          return this.error(error);
        }
      }
    };
  }
});

// src/controllers/questions/questions.controller.ts
var questions_controller_exports = {};
__export(questions_controller_exports, {
  QuestionsController: () => QuestionsController
});
import { BaseController as BaseController4 } from "@oxlayer/foundation-http-kit";
import { z as z5 } from "zod";
var createQuestionSchema, updateQuestionSchema, listQuestionsQuerySchema, QuestionsController;
var init_questions_controller = __esm({
  "src/controllers/questions/questions.controller.ts"() {
    "use strict";
    createQuestionSchema = z5.object({
      examId: z5.string().uuid().describe("Exam ID"),
      order: z5.number().int().min(1).optional().describe("Question order (alias for priority)"),
      priority: z5.number().int().min(1).optional().describe("Question priority/order"),
      text: z5.string().min(1).describe("Question text"),
      type: z5.enum(["text", "audio", "technical", "behavioral", "situational"]).optional().describe("Question type - can be presentation format (text/audio) or category (technical/behavioral/situational)"),
      weight: z5.enum(["technical", "behavioral", "situational"]).optional().describe("Question category/weight")
    });
    updateQuestionSchema = z5.object({
      order: z5.number().int().min(1).optional().describe("Question order (alias for priority)"),
      priority: z5.number().int().min(1).optional().describe("Question priority/order"),
      text: z5.string().min(1).optional().describe("Question text"),
      type: z5.enum(["text", "audio", "technical", "behavioral", "situational"]).optional().describe("Question type - can be presentation format (text/audio) or category (technical/behavioral/situational)"),
      weight: z5.enum(["technical", "behavioral", "situational"]).optional().describe("Question category/weight")
    });
    listQuestionsQuerySchema = z5.object({
      examId: z5.string().uuid().optional().describe("Filter by exam ID"),
      type: z5.enum(["text", "audio"]).optional().describe("Filter by type"),
      limit: z5.string().transform(Number).optional().describe("Limit results"),
      offset: z5.string().transform(Number).optional().describe("Offset results")
    });
    QuestionsController = class extends BaseController4 {
      constructor(createQuestionUseCase, getQuestionUseCase, listQuestionsUseCase, updateQuestionUseCase, deleteQuestionUseCase) {
        super();
        this.createQuestionUseCase = createQuestionUseCase;
        this.getQuestionUseCase = getQuestionUseCase;
        this.listQuestionsUseCase = listQuestionsUseCase;
        this.updateQuestionUseCase = updateQuestionUseCase;
        this.deleteQuestionUseCase = deleteQuestionUseCase;
      }
      /**
       * POST /api/questions - Create a new question
       */
      async create(c) {
        try {
          const body = await c.req.json();
          const input = createQuestionSchema.safeParse(body);
          if (!input.success) {
            return this.validationError(input.error.flatten().fieldErrors);
          }
          const priority = input.data.priority ?? input.data.order;
          const weight = input.data.weight;
          const type = input.data.type;
          const questionType = input.data.type;
          const isCategoryType = questionType && ["technical", "behavioral", "situational"].includes(questionType);
          const result = await this.createQuestionUseCase.execute({
            examId: input.data.examId,
            priority,
            text: input.data.text,
            type: isCategoryType ? "text" : type ?? "text",
            weight: isCategoryType ? questionType : weight ?? "medium"
          });
          return this.created({
            message: "Question created successfully",
            question: result
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/questions/:id - Get question by ID
       */
      async getById(c) {
        try {
          const id = c.req.param("id");
          if (!id || !z5.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid question ID");
          }
          const question = await this.getQuestionUseCase.execute({ id });
          if (!question) {
            return this.notFound("Question not found");
          }
          return this.ok({
            message: "Question retrieved successfully",
            question
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/questions - List questions
       */
      async list(c) {
        try {
          const query = listQuestionsQuerySchema.safeParse(c.req.query());
          if (!query.success) {
            return this.validationError(query.error.flatten().fieldErrors);
          }
          const result = await this.listQuestionsUseCase.execute({
            examId: query.data.examId,
            type: query.data.type,
            limit: query.data.limit,
            offset: query.data.offset
          });
          return c.json(result.questions);
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * PATCH /api/questions/:id - Update a question
       */
      async update(c) {
        try {
          const id = c.req.param("id");
          const body = await c.req.json();
          const input = updateQuestionSchema.safeParse(body);
          if (!id || !z5.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid question ID");
          }
          if (!input.success) {
            return this.validationError(input.error.flatten().fieldErrors);
          }
          const priority = input.data.priority ?? input.data.order;
          const weight = input.data.weight;
          const type = input.data.type;
          const questionType = input.data.type;
          const isCategoryType = questionType && ["technical", "behavioral", "situational"].includes(questionType);
          const updateData = {
            priority
          };
          if (input.data.text !== void 0) updateData.text = input.data.text;
          if (isCategoryType) {
            updateData.weight = questionType;
          } else if (weight !== void 0) {
            updateData.weight = weight;
          }
          if (!isCategoryType && type !== void 0) {
            updateData.type = type;
          }
          const result = await this.updateQuestionUseCase.execute({
            id,
            ...updateData
          });
          return this.ok({
            message: "Question updated successfully",
            question: result
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * DELETE /api/questions/:id - Delete a question
       */
      async delete(c) {
        try {
          const id = c.req.param("id");
          if (!id || !z5.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid question ID");
          }
          await this.deleteQuestionUseCase.execute({ id });
          return this.ok({
            message: "Question deleted successfully"
          });
        } catch (error) {
          return this.error(error);
        }
      }
    };
  }
});

// src/controllers/answers/answers.controller.ts
var answers_controller_exports = {};
__export(answers_controller_exports, {
  AnswersController: () => AnswersController
});
import { BaseController as BaseController5 } from "@oxlayer/foundation-http-kit";
import { z as z6 } from "zod";
var createAnswerSchema, updateAnswerSchema, listAnswersQuerySchema, AnswersController;
var init_answers_controller = __esm({
  "src/controllers/answers/answers.controller.ts"() {
    "use strict";
    createAnswerSchema = z6.object({
      assignmentId: z6.string().uuid().describe("Assignment ID"),
      candidateId: z6.string().uuid().describe("Candidate ID"),
      examId: z6.string().uuid().describe("Exam ID"),
      questionId: z6.string().uuid().describe("Question ID"),
      s3Url: z6.string().url().describe("S3 URL for audio file"),
      duration: z6.number().positive().describe("Duration in seconds"),
      contentType: z6.string().describe("Content type (e.g., audio/mp3)"),
      fileSize: z6.number().positive().describe("File size in bytes")
    });
    updateAnswerSchema = z6.object({
      transcription: z6.string().optional().describe("Transcribed text"),
      isValid: z6.boolean().optional().describe("Whether the answer is valid")
    });
    listAnswersQuerySchema = z6.object({
      assignmentId: z6.string().uuid().optional().describe("Filter by assignment ID"),
      candidateId: z6.string().uuid().optional().describe("Filter by candidate ID"),
      examId: z6.string().uuid().optional().describe("Filter by exam ID"),
      questionId: z6.string().uuid().optional().describe("Filter by question ID"),
      isValid: z6.string().transform((v) => v === "true").optional().describe("Filter by validity"),
      limit: z6.string().transform(Number).optional().describe("Limit results"),
      offset: z6.string().transform(Number).optional().describe("Offset results")
    });
    AnswersController = class extends BaseController5 {
      constructor(createAnswerUseCase, getAnswerUseCase, listAnswersUseCase, updateAnswerUseCase, deleteAnswerUseCase) {
        super();
        this.createAnswerUseCase = createAnswerUseCase;
        this.getAnswerUseCase = getAnswerUseCase;
        this.listAnswersUseCase = listAnswersUseCase;
        this.updateAnswerUseCase = updateAnswerUseCase;
        this.deleteAnswerUseCase = deleteAnswerUseCase;
      }
      /**
       * POST /api/answers - Create a new answer
       */
      async create(c) {
        try {
          const body = await c.req.json();
          const input = createAnswerSchema.safeParse(body);
          if (!input.success) {
            return this.validationError(input.error.flatten().fieldErrors);
          }
          const result = await this.createAnswerUseCase.execute(input.data);
          return this.created({
            message: "Answer created successfully",
            answer: result
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/answers/:id - Get answer by ID
       */
      async getById(c) {
        try {
          const id = c.req.param("id");
          if (!id || !z6.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid answer ID");
          }
          const answer = await this.getAnswerUseCase.execute({ id });
          if (!answer) {
            return this.notFound("Answer not found");
          }
          return this.ok({
            message: "Answer retrieved successfully",
            answer
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/answers - List answers
       */
      async list(c) {
        try {
          const query = listAnswersQuerySchema.safeParse(c.req.query());
          if (!query.success) {
            return this.validationError(query.error.flatten().fieldErrors);
          }
          const result = await this.listAnswersUseCase.execute({
            assignmentId: query.data.assignmentId,
            candidateId: query.data.candidateId,
            examId: query.data.examId,
            questionId: query.data.questionId,
            isValid: query.data.isValid,
            limit: query.data.limit,
            offset: query.data.offset
          });
          return this.ok({
            answers: result.answers,
            total: result.total,
            limit: query.data.limit ?? 50,
            offset: query.data.offset ?? 0
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * PATCH /api/answers/:id - Update an answer
       */
      async update(c) {
        try {
          const id = c.req.param("id");
          const body = await c.req.json();
          const input = updateAnswerSchema.safeParse(body);
          if (!id || !z6.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid answer ID");
          }
          if (!input.success) {
            return this.validationError(input.error.flatten().fieldErrors);
          }
          const result = await this.updateAnswerUseCase.execute({
            id,
            ...input.data
          });
          return this.ok({
            message: "Answer updated successfully",
            answer: result
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * DELETE /api/answers/:id - Delete an answer
       */
      async delete(c) {
        try {
          const id = c.req.param("id");
          if (!id || !z6.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid answer ID");
          }
          await this.deleteAnswerUseCase.execute({ id });
          return this.ok({
            message: "Answer deleted successfully"
          });
        } catch (error) {
          return this.error(error);
        }
      }
    };
  }
});

// src/controllers/candidates/candidates.controller.ts
var candidates_controller_exports = {};
__export(candidates_controller_exports, {
  CandidatesController: () => CandidatesController
});
import { BaseController as BaseController6 } from "@oxlayer/foundation-http-kit";
import { z as z7 } from "zod";
var createCandidateSchema, updateCandidateSchema, listCandidatesQuerySchema, CandidatesController;
var init_candidates_controller = __esm({
  "src/controllers/candidates/candidates.controller.ts"() {
    "use strict";
    createCandidateSchema = z7.object({
      workspaceId: z7.string().uuid().describe("Workspace ID"),
      name: z7.string().min(1).max(255).describe("Candidate name"),
      email: z7.string().email().optional().describe("Candidate email"),
      cpf: z7.string().length(11).optional().describe("CPF (Brazilian tax ID)"),
      externalId: z7.string().optional().describe("External system ID")
    });
    updateCandidateSchema = z7.object({
      name: z7.string().min(1).max(255).optional().describe("Candidate name"),
      email: z7.string().email().optional().describe("Candidate email"),
      cpf: z7.string().length(11).optional().describe("CPF (Brazilian tax ID)"),
      externalId: z7.string().optional().describe("External system ID")
    });
    listCandidatesQuerySchema = z7.object({
      workspaceId: z7.string().uuid().optional().describe("Filter by workspace ID"),
      examId: z7.string().uuid().optional().describe("Filter by exam ID")
    });
    CandidatesController = class extends BaseController6 {
      constructor(createCandidateUseCase, getCandidateUseCase, listCandidatesUseCase, updateCandidateUseCase, deleteCandidateUseCase) {
        super();
        this.createCandidateUseCase = createCandidateUseCase;
        this.getCandidateUseCase = getCandidateUseCase;
        this.listCandidatesUseCase = listCandidatesUseCase;
        this.updateCandidateUseCase = updateCandidateUseCase;
        this.deleteCandidateUseCase = deleteCandidateUseCase;
      }
      /**
       * POST /api/candidates - Create a new candidate
       */
      async create(c) {
        try {
          const body = await c.req.json();
          const input = createCandidateSchema.safeParse(body);
          if (!input.success) {
            return this.validationError(input.error.flatten().fieldErrors);
          }
          const result = await this.createCandidateUseCase.execute(input.data);
          return this.created({
            message: "Candidate created successfully",
            candidateId: result.candidateId
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/candidates/:id - Get candidate by ID
       */
      async getById(c) {
        try {
          const id = c.req.param("id");
          if (!id || !z7.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid candidate ID");
          }
          const candidate = await this.getCandidateUseCase.execute({ id });
          return this.ok({
            message: "Candidate retrieved successfully",
            candidate
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/candidates - List candidates
       */
      async list(c) {
        try {
          const query = listCandidatesQuerySchema.safeParse(c.req.query());
          if (!query.success) {
            return this.validationError(query.error.flatten().fieldErrors);
          }
          const result = await this.listCandidatesUseCase.execute({
            workspaceId: query.data.workspaceId,
            examId: query.data.examId
          });
          return c.json(result.candidates);
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * PATCH /api/candidates/:id - Update a candidate
       */
      async update(c) {
        try {
          const id = c.req.param("id");
          const body = await c.req.json();
          const input = updateCandidateSchema.safeParse(body);
          if (!id || !z7.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid candidate ID");
          }
          if (!input.success) {
            return this.validationError(input.error.flatten().fieldErrors);
          }
          const candidate = await this.updateCandidateUseCase.execute({
            id,
            ...input.data
          });
          return this.ok({
            message: "Candidate updated successfully",
            candidate
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * DELETE /api/candidates/:id - Delete a candidate
       */
      async delete(c) {
        try {
          const id = c.req.param("id");
          if (!id || !z7.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid candidate ID");
          }
          await this.deleteCandidateUseCase.execute({ id });
          return this.ok({
            message: "Candidate deleted successfully"
          });
        } catch (error) {
          return this.error(error);
        }
      }
    };
  }
});

// src/db/admin-schema.ts
var admin_schema_exports = {};
__export(admin_schema_exports, {
  createAdminTableSQLString: () => createAdminTableSQLString,
  databases: () => databases,
  organizations: () => organizations,
  realms: () => realms,
  settings: () => settings
});
import { pgTable as pgTable2, uuid as uuid2, varchar as varchar2, timestamp as timestamp2, text as text2, jsonb as jsonb2, boolean as boolean2, index as index2, integer as integer2 } from "drizzle-orm/pg-core";
var realms, databases, organizations, settings, createAdminTableSQLString;
var init_admin_schema = __esm({
  "src/db/admin-schema.ts"() {
    "use strict";
    realms = pgTable2("realms", {
      id: uuid2("id").primaryKey().defaultRandom(),
      realmId: varchar2("realm_id", { length: 255 }).notNull().unique(),
      // e.g., "company-name" (without globex_ prefix)
      realmName: varchar2("realm_name", { length: 255 }).notNull().unique(),
      // e.g., "globex_company-name"
      displayName: varchar2("display_name", { length: 255 }).notNull(),
      enabled: boolean2("enabled").notNull().default(true),
      // Owner information
      ownerId: varchar2("owner_id", { length: 255 }),
      ownerEmail: varchar2("owner_email", { length: 255 }),
      ownerFirstName: varchar2("owner_first_name", { length: 255 }),
      ownerLastName: varchar2("owner_last_name", { length: 255 }),
      // Provisioning metadata
      provisionedAt: timestamp2("provisioned_at").notNull().defaultNow(),
      lastSyncedAt: timestamp2("last_synced_at"),
      syncStatus: varchar2("sync_status", { length: 50 }).default("synced"),
      // synced, pending, failed
      // Settings
      settings: jsonb2("settings").$type(),
      createdAt: timestamp2("created_at").notNull().defaultNow(),
      updatedAt: timestamp2("updated_at").notNull().defaultNow()
    }, (table) => ({
      realmIdIdx: index2("idx_realms_realm_id").on(table.realmId),
      enabledIdx: index2("idx_realms_enabled").on(table.enabled)
    }));
    databases = pgTable2("databases", {
      id: uuid2("id").primaryKey().defaultRandom(),
      databaseName: varchar2("database_name", { length: 255 }).notNull().unique(),
      realmId: varchar2("realm_id", { length: 255 }).notNull(),
      // e.g., "company-name" (without globex_ prefix)
      // Workspace information
      workspaceId: uuid2("workspace_id").notNull(),
      workspaceName: varchar2("workspace_name", { length: 255 }).notNull(),
      domainAliases: jsonb2("domain_aliases").$type(),
      // Database credentials (for tenant-specific database users)
      dbUser: varchar2("db_user", { length: 255 }),
      // Database username for this tenant
      dbPassword: varchar2("db_password", { length: 255 }),
      // Database password for this tenant (encrypted in production)
      // Database metadata
      size: varchar2("size", { length: 50 }),
      // e.g., "10MB", "100GB"
      tableCount: integer2("table_count").default(0),
      lastMigrationAt: timestamp2("last_migration_at"),
      // Status
      enabled: boolean2("enabled").notNull().default(true),
      status: varchar2("status", { length: 50 }).default("active"),
      // active, inactive, provisioning
      createdAt: timestamp2("created_at").notNull().defaultNow(),
      updatedAt: timestamp2("updated_at").notNull().defaultNow()
    }, (table) => ({
      databaseNameIdx: index2("idx_databases_database_name").on(table.databaseName),
      realmIdIdx: index2("idx_databases_realm_id").on(table.realmId),
      workspaceIdIdx: index2("idx_databases_workspace_id").on(table.workspaceId),
      realmWorkspaceIdx: index2("idx_databases_realm_workspace").on(table.realmId, table.workspaceId)
    }));
    organizations = pgTable2("organizations", {
      id: uuid2("id").primaryKey().defaultRandom(),
      // Link to realm
      realmId: varchar2("realm_id", { length: 255 }).notNull(),
      // Link to workspace
      workspaceId: uuid2("workspace_id").notNull(),
      workspaceName: varchar2("workspace_name", { length: 255 }).notNull(),
      // Keycloak organization info
      keycloakOrganizationId: varchar2("keycloak_organization_id", { length: 255 }),
      // Keycloak's organization ID
      name: varchar2("name", { length: 255 }).notNull(),
      // Organization normalized name (lowercase alphanumeric with hyphens)
      alias: varchar2("alias", { length: 255 }),
      // Organization display name (original name without normalization)
      // Owner assignment
      ownerAssigned: boolean2("owner_assigned").notNull().default(false),
      ownerUsername: varchar2("owner_username", { length: 255 }),
      // Provisioning status
      status: varchar2("status", { length: 50 }).notNull().default("pending"),
      // pending, created, failed
      // Error tracking
      lastError: text2("last_error"),
      errorMessage: text2("error_message"),
      retryCount: integer2("retry_count").default(0),
      // Timestamps
      createdAt: timestamp2("created_at").notNull().defaultNow(),
      updatedAt: timestamp2("updated_at").notNull().defaultNow()
    }, (table) => ({
      realmIdIdx: index2("idx_organizations_realm_id").on(table.realmId),
      workspaceIdIdx: index2("idx_organizations_workspace_id").on(table.workspaceId),
      statusIdx: index2("idx_organizations_status").on(table.status),
      realmWorkspaceIdx: index2("idx_organizations_realm_workspace").on(table.realmId, table.workspaceId)
    }));
    settings = pgTable2("settings", {
      id: uuid2("id").primaryKey().defaultRandom(),
      key: varchar2("key", { length: 255 }).notNull().unique(),
      value: jsonb2("value").notNull(),
      description: text2("description"),
      updatedAt: timestamp2("updated_at").notNull().defaultNow()
    }, (table) => ({
      keyIdx: index2("idx_settings_key").on(table.key)
    }));
    createAdminTableSQLString = `
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
  }
});

// src/config/admin-db.config.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres2 from "postgres";
function getAdminConfig() {
  return {
    host: ENV.POSTGRES_ADMIN_HOST || ENV.POSTGRES_HOST || "localhost",
    port: Number(ENV.POSTGRES_ADMIN_PORT || ENV.POSTGRES_PORT) || 5432,
    user: ENV.POSTGRES_ADMIN_USER || ENV.POSTGRES_USER || "postgres",
    password: ENV.POSTGRES_ADMIN_PASSWORD || ENV.POSTGRES_PASSWORD || "postgres",
    database: ENV.POSTGRES_ADMIN_DATABASE || "globex_admin"
  };
}
function getMasterConnection() {
  const config = getAdminConfig();
  return postgres2({
    host: config.host,
    port: config.port,
    database: "postgres",
    user: config.user,
    password: config.password,
    max: 1
  });
}
async function getAdminDb() {
  if (!adminDbInstance) {
    const config = getAdminConfig();
    if (!initPromise) {
      initPromise = initAdminDatabaseInternal(config);
    }
    await initPromise;
    const client = postgres2({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: 10,
      // Smaller pool for admin operations
      idle_timeout: 30,
      connect_timeout: 10
    });
    adminDbInstance = drizzle(client, { schema: admin_schema_exports });
  }
  return adminDbInstance;
}
async function initAdminDatabaseInternal(config) {
  try {
    await ensureAdminDatabaseExistsInternal(config);
    const tempClient = postgres2({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: 1
    });
    try {
      const { createAdminTableSQLString: createAdminTableSQLString2 } = await Promise.resolve().then(() => (init_admin_schema(), admin_schema_exports));
      try {
        await tempClient.unsafe(createAdminTableSQLString2);
      } catch (err) {
        if (!err.message.includes("already exists") && !err.message.includes("duplicate")) {
          console.warn("Admin DB init warning:", err.message);
        }
      }
      console.log("\u2705 Admin database tables initialized");
    } finally {
      await tempClient.end();
    }
  } catch (err) {
    console.error("Failed to initialize admin database:", err);
    throw err;
  }
}
async function ensureAdminDatabaseExistsInternal(config) {
  const sql4 = getMasterConnection();
  try {
    const result = await sql4.unsafe(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [config.database]);
    if (result.length === 0) {
      await sql4.unsafe(`CREATE DATABASE "${config.database}" ENCODING 'UTF8'`);
      console.log(`\u2705 Created admin database: ${config.database}`);
    } else {
      console.log(`\u2139\uFE0F  Admin database already exists: ${config.database}`);
    }
  } catch (err) {
    console.error("Failed to ensure admin database exists:", err);
    throw err;
  } finally {
    await sql4.end();
  }
}
async function initAdminDbOnStartup() {
  const config = getAdminConfig();
  if (!initPromise) {
    initPromise = initAdminDatabaseInternal(config);
  }
  await initPromise;
}
var adminDbInstance, initPromise;
var init_admin_db_config = __esm({
  "src/config/admin-db.config.ts"() {
    "use strict";
    init_app_config();
    init_admin_schema();
    adminDbInstance = null;
    initPromise = null;
  }
});

// src/config/database-resolver.config.ts
var database_resolver_config_exports = {};
__export(database_resolver_config_exports, {
  clearCredentialsCache: () => clearCredentialsCache,
  getDatabaseCredentialsForWorkspace: () => getDatabaseCredentialsForWorkspace,
  getDatabaseName: () => getDatabaseName,
  getDatabaseNameForWorkspace: () => getDatabaseNameForWorkspace,
  getKeycloakDatabaseResolver: () => getKeycloakDatabaseResolver,
  getTenantDatabase: () => getTenantDatabase,
  shutdownDatabaseResolver: () => shutdownDatabaseResolver
});
import { createKeycloakDatabaseResolver } from "@oxlayer/pro-adapters-postgres-tenancy";
import postgres3 from "postgres";
import { drizzle as drizzle2 } from "drizzle-orm/postgres-js";
import { eq as eq11 } from "drizzle-orm";
async function mockCredentialsResolver(secretRef) {
  try {
    const parts = secretRef.split("/");
    if (parts.length >= 3 && parts[0] === "tenants") {
      const realm = parts[1];
      const workspaceId = parts[2];
      const credentials = await getDatabaseCredentialsForWorkspace(workspaceId, realm);
      return credentials;
    }
  } catch (error) {
    console.error("Failed to get tenant credentials, using defaults:", error);
  }
  return {
    username: ENV.POSTGRES_USER || "postgres",
    password: ENV.POSTGRES_PASSWORD || "postgres"
  };
}
async function getAdminDb2() {
  if (!adminDbInstance2) {
    const client = postgres3({
      host: ENV.POSTGRES_HOST || "localhost",
      port: Number(ENV.POSTGRES_PORT) || 5432,
      database: ENV.POSTGRES_ADMIN_DATABASE || "globex_admin",
      user: ENV.POSTGRES_USER || "postgres",
      password: ENV.POSTGRES_PASSWORD || "postgres",
      max: 1,
      // Small pool for admin lookups
      idle_timeout: 30,
      connect_timeout: 10
    });
    adminDbInstance2 = drizzle2(client);
  }
  return adminDbInstance2;
}
async function getDatabaseNameForWorkspace(workspaceId, realmId) {
  const cacheKey = `${realmId}:${workspaceId}`;
  const cached = databaseNameCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  try {
    const adminDb = await getAdminDb2();
    const results = await adminDb.select({ databaseName: databases.databaseName }).from(databases).where(eq11(databases.workspaceId, workspaceId)).limit(1);
    if (results.length > 0) {
      const databaseName = results[0].databaseName;
      databaseNameCache.set(cacheKey, databaseName);
      return databaseName;
    }
    const fallbackName = `globex_workspace_${realmId}_${workspaceId}`;
    databaseNameCache.set(cacheKey, fallbackName);
    return fallbackName;
  } catch (error) {
    console.error("Failed to query admin database for database name:", error);
    const fallbackName = `globex_workspace_${realmId}_${workspaceId}`;
    return fallbackName;
  }
}
async function getDatabaseCredentialsForWorkspace(workspaceId, realmId) {
  const cacheKey = `${realmId}:${workspaceId}`;
  const cached = credentialsCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  try {
    const adminDb = await getAdminDb2();
    const results = await adminDb.select({
      dbUser: databases.dbUser,
      dbPassword: databases.dbPassword
    }).from(databases).where(eq11(databases.workspaceId, workspaceId)).limit(1);
    if (results.length > 0 && results[0].dbUser && results[0].dbPassword) {
      const credentials = {
        username: results[0].dbUser,
        password: results[0].dbPassword
      };
      credentialsCache.set(cacheKey, credentials);
      return credentials;
    }
    const defaultCredentials = {
      username: ENV.POSTGRES_USER || "postgres",
      password: ENV.POSTGRES_PASSWORD || "postgres"
    };
    credentialsCache.set(cacheKey, defaultCredentials);
    return defaultCredentials;
  } catch (error) {
    console.error("Failed to query admin database for credentials:", error);
    const defaultCredentials = {
      username: ENV.POSTGRES_USER || "postgres",
      password: ENV.POSTGRES_PASSWORD || "postgres"
    };
    return defaultCredentials;
  }
}
function getKeycloakDatabaseResolver() {
  if (!keycloakDatabaseResolver) {
    keycloakDatabaseResolver = createKeycloakDatabaseResolver(keycloakDatabaseResolverOptions);
  }
  return keycloakDatabaseResolver;
}
async function getTenantDatabase() {
  const resolver = getKeycloakDatabaseResolver();
  return resolver.resolve("unused");
}
function getDatabaseName() {
  const context = globalThis.__tenant_context__;
  if (context) {
    return `globex_workspace_${context.realm}_${context.workspaceId}`;
  }
  return void 0;
}
async function shutdownDatabaseResolver() {
  if (keycloakDatabaseResolver) {
    await keycloakDatabaseResolver.closeAll();
    keycloakDatabaseResolver = null;
  }
}
function clearCredentialsCache(workspaceId) {
  for (const [key, _] of credentialsCache.entries()) {
    if (key.endsWith(`:${workspaceId}`)) {
      credentialsCache.delete(key);
    }
  }
  for (const [key, _] of databaseNameCache.entries()) {
    if (key.endsWith(`:${workspaceId}`)) {
      databaseNameCache.delete(key);
    }
  }
}
var adminDbInstance2, databaseNameCache, credentialsCache, keycloakDatabaseResolverOptions, keycloakDatabaseResolver;
var init_database_resolver_config = __esm({
  "src/config/database-resolver.config.ts"() {
    "use strict";
    init_app_config();
    init_admin_schema();
    adminDbInstance2 = null;
    databaseNameCache = /* @__PURE__ */ new Map();
    credentialsCache = /* @__PURE__ */ new Map();
    keycloakDatabaseResolverOptions = {
      baseHost: ENV.POSTGRES_HOST || "localhost",
      basePort: ENV.POSTGRES_PORT || 5432,
      baseUser: ENV.POSTGRES_USER || "postgres",
      poolSize: 10,
      ssl: ENV.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      getCredentials: mockCredentialsResolver,
      // Custom database name resolver that queries admin database
      getDatabaseName: async (realm, workspaceId) => {
        const databaseName = await getDatabaseNameForWorkspace(workspaceId, realm);
        return databaseName || `globex_workspace_${realm}_${workspaceId}`;
      }
    };
    keycloakDatabaseResolver = null;
  }
});

// src/controllers/admin/controller.ts
var controller_exports = {};
__export(controller_exports, {
  AdminController: () => AdminController,
  createAdminController: () => createAdminController
});
import { z as z8 } from "zod";
import postgres4 from "postgres";
import { and as and9, eq as eq12, sql as sql2 } from "drizzle-orm";
function checkAdminAuth(c) {
  const authPayload = c.get("authPayload");
  if (!authPayload) {
    return {
      authorized: false,
      error: "No auth payload found"
    };
  }
  const realmRoles = authPayload.realm_access?.roles || [];
  if (realmRoles.includes("platform-admin")) {
    return { authorized: true };
  }
  const resourceAccess = authPayload.resource_access || {};
  for (const resource of Object.values(resourceAccess)) {
    if (resource.roles?.includes("platform-admin")) {
      return { authorized: true };
    }
  }
  return {
    authorized: false,
    error: "platform-admin role required"
  };
}
function getMasterConnection2() {
  const host = process.env.POSTGRES_ADMIN_HOST || process.env.POSTGRES_HOST;
  const port = Number(process.env.POSTGRES_ADMIN_PORT || process.env.POSTGRES_PORT);
  const user = process.env.POSTGRES_ADMIN_USER || process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_ADMIN_PASSWORD || process.env.POSTGRES_PASSWORD;
  return postgres4({
    host,
    port,
    database: "postgres",
    user,
    password,
    max: 1
  });
}
function createAdminController() {
  return new AdminController();
}
var ownerUserSchema, provisionRealmSchema, createDatabaseSchema, provisionWorkspaceSchema, provisionOrganizationSchema, listUsersSchema, AdminController;
var init_controller = __esm({
  "src/controllers/admin/controller.ts"() {
    "use strict";
    init_admin_db_config();
    init_admin_schema();
    ownerUserSchema = z8.object({
      email: z8.string().email("Invalid email address"),
      firstName: z8.string().min(1, "First name is required"),
      lastName: z8.string().min(1, "Last name is required"),
      temporaryPassword: z8.string().min(8, "Password must be at least 8 characters")
    });
    provisionRealmSchema = z8.object({
      realmId: z8.string().min(1).regex(/^[a-z0-9-]+$/, "Realm ID must be lowercase alphanumeric with hyphens"),
      displayName: z8.string().min(1),
      owner: ownerUserSchema,
      workspaces: z8.array(z8.object({
        id: z8.string().min(1).optional().default(() => crypto.randomUUID()),
        name: z8.string().min(1),
        alias: z8.string().min(1).optional(),
        domainAliases: z8.array(z8.string()).optional().default([])
      })).min(1, "At least one workspace is required")
    });
    createDatabaseSchema = z8.object({
      realm: z8.string().min(1),
      workspaceId: z8.string().min(1)
    });
    provisionWorkspaceSchema = z8.object({
      realmId: z8.string().min(1).describe("Realm ID (without globex_ prefix)"),
      workspaceId: z8.string().uuid().optional().describe("Workspace UUID (auto-generated if not provided)"),
      name: z8.string().min(1).max(255).describe("Workspace name"),
      domainAliases: z8.array(z8.string().url()).optional().describe("Custom domain aliases"),
      rootManagerEmail: z8.string().email().optional().describe("Root manager/owner email")
    });
    provisionOrganizationSchema = z8.object({
      name: z8.string().min(1).max(255).describe("Organization normalized name (lowercase alphanumeric with hyphens)"),
      alias: z8.string().min(1).max(255).describe("Organization display name"),
      domainAliases: z8.array(z8.string().url()).optional().describe("Custom domain aliases"),
      rootManagerEmail: z8.string().email().describe("Root manager/owner email"),
      rootManagerFirstName: z8.string().min(1).describe("Root manager first name"),
      rootManagerLastName: z8.string().min(1).describe("Root manager last name"),
      rootManagerPassword: z8.string().min(8).describe("Root manager password (min 8 chars)")
    });
    listUsersSchema = z8.object({
      realm: z8.string().min(1)
    });
    AdminController = class {
      /**
       * Provision a new B2B realm in Keycloak
       * POST /api/admin/realms/provision
       */
      async provisionRealm(c) {
        const auth = checkAdminAuth(c);
        if (!auth.authorized) {
          return c.json({ error: "Unauthorized", details: auth.error }, 403);
        }
        try {
          const body = await c.req.json();
          const validated = provisionRealmSchema.parse(body);
          const result = await this.doProvisionRealm(validated);
          return c.json({
            success: true,
            message: `Realm "${validated.realmId}" provisioned successfully`,
            realm: result
          });
        } catch (error) {
          console.error("Failed to provision realm:", error);
          return c.json({
            error: "Failed to provision realm",
            details: error.message || String(error)
          }, 500);
        }
      }
      /**
       * Create tenant database
       * POST /api/admin/databases/create
       */
      async createDatabase(c) {
        const auth = checkAdminAuth(c);
        if (!auth.authorized) {
          return c.json({ error: "Unauthorized", details: auth.error }, 403);
        }
        try {
          const body = await c.req.json();
          const validated = createDatabaseSchema.parse(body);
          const result = await this.doCreateDatabase(validated.realm, validated.workspaceId);
          if (!result.existed && result.dbUser && result.dbPassword) {
            const adminDb = await getAdminDb();
            try {
              await adminDb.insert(databases).values({
                databaseName: result.database,
                realmId: validated.realm,
                workspaceId: validated.workspaceId,
                workspaceName: validated.workspaceId,
                // Use workspaceId as fallback for name
                domainAliases: [],
                dbUser: result.dbUser,
                dbPassword: result.dbPassword,
                enabled: true,
                status: "active"
              }).onConflictDoNothing();
            } catch (dbRegError) {
              console.warn("Failed to register database in admin database:", dbRegError?.message);
            }
          }
          return c.json({
            success: true,
            message: `Database "${result.database}" ${result.existed ? "already exists" : "created successfully"}`,
            database: result.database
          });
        } catch (error) {
          console.error("Failed to create database:", error);
          return c.json({
            error: "Failed to create database",
            details: error.message || String(error)
          }, 500);
        }
      }
      /**
       * Run migrations on tenant database
       * POST /api/admin/databases/migrate
       */
      async migrateDatabase(c) {
        const auth = checkAdminAuth(c);
        if (!auth.authorized) {
          return c.json({ error: "Unauthorized", details: auth.error }, 403);
        }
        try {
          const body = await c.req.json();
          const validated = createDatabaseSchema.parse(body);
          await this.doMigrateDatabase(validated.realm, validated.workspaceId);
          const dbName = `globex_workspace_${validated.realm}_${validated.workspaceId}`;
          return c.json({
            success: true,
            message: `Migrations run successfully on "${dbName}"`,
            database: dbName
          });
        } catch (error) {
          console.error("Failed to run migrations:", error);
          return c.json({
            error: "Failed to run migrations",
            details: error.message || String(error)
          }, 500);
        }
      }
      /**
       * Full tenant provisioning (realm + database + migrations)
       * POST /api/admin/tenants/provision
       */
      async provisionTenant(c) {
        const auth = checkAdminAuth(c);
        if (!auth.authorized) {
          return c.json({ error: "Unauthorized", details: auth.error }, 403);
        }
        const { Logger } = await import("@oxlayer/capabilities-internal");
        const log = new Logger("admin-provision");
        try {
          const body = await c.req.json();
          const validated = provisionRealmSchema.parse(body);
          log.info("Starting tenant provisioning", { realmId: validated.realmId, workspacesCount: validated.workspaces.length });
          const workspacesWithIds = validated.workspaces.map((w) => ({
            ...w,
            id: w.id || crypto.randomUUID()
          }));
          const configWithIds = { ...validated, workspaces: workspacesWithIds };
          const results = {
            realm: null,
            databases: []
          };
          try {
            results.realm = await this.doProvisionRealm(configWithIds);
          } catch (realmError) {
            log.error("Failed to provision realm", { error: realmError?.message || realmError });
            return c.json({
              success: false,
              error: "Failed to provision realm",
              details: realmError.message || String(realmError),
              results
            }, 500);
          }
          for (const workspace of workspacesWithIds) {
            const dbResult = {
              workspaceId: workspace.id,
              workspaceName: workspace.name
            };
            log.debug("Processing workspace", { workspaceId: workspace.id, workspaceName: workspace.name });
            try {
              const createResult = await this.doCreateDatabase(validated.realmId, workspace.id);
              dbResult.database = createResult.database;
              dbResult.databaseStatus = createResult.existed ? "existed" : "created";
              log.debug("Database created", { database: dbResult.database, status: dbResult.databaseStatus });
              if (!createResult.existed) {
                const adminDb = await getAdminDb();
                try {
                  await adminDb.insert(databases).values({
                    databaseName: createResult.database,
                    realmId: validated.realmId,
                    workspaceId: workspace.id,
                    workspaceName: workspace.name,
                    domainAliases: workspace.domainAliases || [],
                    dbUser: createResult.dbUser,
                    dbPassword: createResult.dbPassword,
                    enabled: true,
                    status: "active"
                  }).onConflictDoNothing();
                  dbResult.adminDbRegistration = "completed";
                  log.debug("Database registered in admin database", { database: createResult.database });
                } catch (dbRegError) {
                  dbResult.adminDbRegistration = "failed";
                  dbResult.adminDbError = dbRegError.message;
                  log.warn("Failed to register database in admin database", { error: dbRegError?.message });
                }
              } else {
                dbResult.adminDbRegistration = "skipped";
              }
              try {
                await this.doMigrateDatabase(validated.realmId, workspace.id);
                dbResult.migrations = "completed";
                log.debug("Migrations completed", { database: dbResult.database });
              } catch (migrationError) {
                dbResult.migrations = "failed";
                dbResult.migrationError = migrationError.message;
                log.error("Migrations failed", { database: dbResult.database, error: migrationError?.message });
              }
            } catch (dbError) {
              dbResult.databaseStatus = "failed";
              dbResult.error = dbError.message;
              log.error("Database creation failed", { workspaceId: workspace.id, error: dbError?.message });
            }
            results.databases.push(dbResult);
          }
          log.info("Tenant provisioning completed", { realmId: validated.realmId, databasesCount: results.databases.length });
          return c.json({
            success: true,
            message: `Tenant "${validated.realmId}" provisioned successfully`,
            results
          });
        } catch (error) {
          log.error("Failed to provision tenant", { error: error?.message || error });
          return c.json({
            success: false,
            error: "Failed to provision tenant",
            details: error.message || String(error)
          }, 500);
        }
      }
      /**
       * Provision workspace (organization) within existing realm
       * POST /api/admin/workspaces/provision
       *
       * Creates a new database for a workspace within an existing realm.
       * This is used when creating a new organization in the people app.
       */
      async provisionWorkspace(c) {
        const auth = checkAdminAuth(c);
        if (!auth.authorized) {
          return c.json({ error: "Unauthorized", details: auth.error }, 403);
        }
        const { Logger } = await import("@oxlayer/capabilities-internal");
        const log = new Logger("admin-workspace-provision");
        try {
          const body = await c.req.json();
          const validated = provisionWorkspaceSchema.parse(body);
          log.info("Starting workspace provisioning", { realmId: validated.realmId, name: validated.name });
          const workspaceId = validated.workspaceId || crypto.randomUUID();
          const createResult = await this.doCreateDatabase(validated.realmId, workspaceId);
          const adminDb = await getAdminDb();
          try {
            await adminDb.insert(databases).values({
              databaseName: createResult.database,
              realmId: validated.realmId,
              workspaceId,
              workspaceName: validated.name,
              domainAliases: validated.domainAliases || [],
              dbUser: createResult.dbUser,
              dbPassword: createResult.dbPassword,
              enabled: true,
              status: "active"
            }).onConflictDoNothing();
            log.debug("Database registered in admin database", { database: createResult.database });
          } catch (dbRegError) {
            log.warn("Failed to register database in admin database", { error: dbRegError?.message });
          }
          try {
            await this.doMigrateDatabase(validated.realmId, workspaceId);
          } catch (migrationError) {
            log.error("Migrations failed", { database: createResult.database, error: migrationError?.message });
            return c.json({
              error: "Failed to run migrations",
              details: migrationError.message || String(migrationError)
            }, 500);
          }
          log.info("Workspace provisioning completed", { realmId: validated.realmId, workspaceId, database: createResult.database });
          return c.json({
            success: true,
            message: `Workspace "${validated.name}" provisioned successfully`,
            workspace: {
              id: workspaceId,
              name: validated.name,
              realmId: validated.realmId,
              databaseName: createResult.database,
              domainAliases: validated.domainAliases || [],
              rootManagerEmail: validated.rootManagerEmail
            }
          });
        } catch (error) {
          log.error("Failed to provision workspace", { error: error?.message || error });
          return c.json({
            error: "Failed to provision workspace",
            details: error.message || String(error)
          }, 500);
        }
      }
      /**
       * Provision organization (for People app)
       * POST /api/organizations/provision
       *
       * Creates a new organization within the user's realm with:
       * - Keycloak organization
       * - Workspace with database provisioning
       * - Root manager user setup
       *
       * Note: This endpoint uses regular auth (not platform-admin)
       * Users can only create organizations in their own realm
       */
      async provisionOrganization(c) {
        const authPayload = c.get("authPayload");
        if (!authPayload) {
          return c.json({ error: "Unauthorized" }, 401);
        }
        const { Logger } = await import("@oxlayer/capabilities-internal");
        const log = new Logger("org-provision");
        try {
          const body = await c.req.json();
          const validated = provisionOrganizationSchema.parse(body);
          const realmName = authPayload.realm_name || authPayload.realmAccess?.realm || "globex";
          const realmId = realmName.replace("globex_", "");
          const userId = authPayload.sub || authPayload.preferred_username;
          log.info("Starting organization provisioning", { realmId, realmName, userId, orgName: validated.name });
          const organizationId = crypto.randomUUID();
          let keycloakOrganizationId;
          try {
            const { KeycloakAdminClient } = await import("@oxlayer/cli-keycloak-bootstrap");
            const keycloakConfig2 = {
              url: process.env.KEYCLOAK_SERVER_URL || "http://localhost:8080",
              admin: {
                username: process.env.KEYCLOAK_ADMIN || "admin",
                password: process.env.KEYCLOAK_ADMIN_PASSWORD || "admin"
              }
            };
            const adminClient = new KeycloakAdminClient(keycloakConfig2);
            await adminClient.authenticate();
            const org = await adminClient.createOrganization(realmName, {
              name: validated.name,
              domainAliases: validated.domainAliases || []
            });
            keycloakOrganizationId = org.id;
            log.info("Keycloak organization created", { organizationId: keycloakOrganizationId, name: validated.name });
            const username = validated.rootManagerEmail.toLowerCase().replace(/[@.]/g, "_");
            const rootManagerUserId = await adminClient.createUser(realmName, {
              username,
              email: validated.rootManagerEmail,
              firstName: validated.rootManagerFirstName,
              lastName: validated.rootManagerLastName,
              enabled: true,
              emailVerified: false,
              credentials: [{
                type: "password",
                value: validated.rootManagerPassword,
                temporary: true
              }],
              attributes: {
                organizationId: [keycloakOrganizationId]
              }
            });
            log.info("Root manager user created", { username, userId: rootManagerUserId, email: validated.rootManagerEmail });
            await adminClient.inviteUserToOrganization(realmName, keycloakOrganizationId, rootManagerUserId);
            log.info("Root manager invited to organization", { username, userId: rootManagerUserId, organizationId: keycloakOrganizationId });
            const ownerRole = await adminClient.getRealmRole(realmName, "owner");
            if (ownerRole) {
              await adminClient.assignRealmRoles(realmName, username, [ownerRole]);
              log.info("Owner role assigned to root manager", { username });
            }
          } catch (keycloakError) {
            log.error("Failed to create Keycloak organization", { error: keycloakError?.message || keycloakError });
            return c.json({
              error: "Failed to create organization in Keycloak",
              details: keycloakError.message || String(keycloakError)
            }, 500);
          }
          const createResult = await this.doCreateDatabase(realmId, organizationId);
          const adminDb = await getAdminDb();
          try {
            await adminDb.insert(databases).values({
              databaseName: createResult.database,
              realmId,
              workspaceId: organizationId,
              workspaceName: validated.name,
              domainAliases: validated.domainAliases || [],
              dbUser: createResult.dbUser,
              dbPassword: createResult.dbPassword,
              enabled: true,
              status: "active"
            }).onConflictDoNothing();
            log.debug("Database registered in admin database", { database: createResult.database });
          } catch (dbRegError) {
            log.warn("Failed to register database in admin database", { error: dbRegError?.message });
          }
          try {
            await this.doMigrateDatabase(realmId, organizationId);
          } catch (migrationError) {
            log.error("Migrations failed", { database: createResult.database, error: migrationError?.message });
            return c.json({
              error: "Failed to run migrations",
              details: migrationError.message || String(migrationError)
            }, 500);
          }
          log.info("Organization provisioning completed", {
            realmId,
            realmName,
            organizationId,
            keycloakOrganizationId,
            database: createResult.database
          });
          return c.json({
            success: true,
            message: `Organization "${validated.name}" provisioned successfully`,
            organization: {
              id: organizationId,
              keycloakId: keycloakOrganizationId,
              name: validated.name,
              realmId,
              realmName,
              databaseName: createResult.database,
              domainAliases: validated.domainAliases || [],
              rootManagerEmail: validated.rootManagerEmail
            }
          });
        } catch (error) {
          log.error("Failed to provision organization", { error: error?.message || error });
          return c.json({
            error: "Failed to provision organization",
            details: error.message || String(error)
          }, 500);
        }
      }
      /**
       * Retry organization creation for a workspace
       * POST /api/admin/tenants/:realmId/organizations/retry
       *
       * Retries creating a Keycloak organization for a workspace that previously failed.
       * This is useful after enabling the Organizations extension in Keycloak.
       */
      async retryOrganization(c) {
        const auth = checkAdminAuth(c);
        if (!auth.authorized) {
          return c.json({ error: "Unauthorized", details: auth.error }, 403);
        }
        const { Logger } = await import("@oxlayer/capabilities-internal");
        const log = new Logger("admin-org-retry");
        try {
          const realmId = c.req.param("realmId");
          const body = await c.req.json();
          const workspaceId = body.workspaceId;
          if (!workspaceId) {
            return c.json({
              error: "Bad request",
              details: "workspaceId is required"
            }, 400);
          }
          log.info("Retrying organization creation", { realmId, workspaceId });
          const adminDb = await getAdminDb();
          const orgRecords = await adminDb.select().from(organizations).where(eq12(organizations.realmId, realmId)).where(eq12(organizations.workspaceId, workspaceId));
          if (orgRecords.length === 0) {
            return c.json({
              error: "Not found",
              details: `No organization record found for realm "${realmId}" and workspace "${workspaceId}"`
            }, 404);
          }
          const orgRecord = orgRecords[0];
          if (orgRecord.status === "created") {
            return c.json({
              success: true,
              message: "Organization already created",
              organization: {
                id: orgRecord.keycloakOrganizationId,
                name: orgRecord.name,
                workspaceId: orgRecord.workspaceId,
                status: orgRecord.status
              }
            });
          }
          const realmRecords = await adminDb.select().from(realms).where(eq12(realms.realmId, realmId));
          if (realmRecords.length === 0) {
            return c.json({
              error: "Not found",
              details: `Realm "${realmId}" not found`
            }, 404);
          }
          const realmName = realmRecords[0].realmName;
          const { KeycloakAdminClient } = await import("@oxlayer/cli-keycloak-bootstrap");
          const keycloakConfig2 = {
            url: process.env.KEYCLOAK_SERVER_URL || "http://localhost:8080",
            admin: {
              username: process.env.KEYCLOAK_ADMIN || "admin",
              password: process.env.KEYCLOAK_ADMIN_PASSWORD || "admin"
            }
          };
          const adminClient = new KeycloakAdminClient(keycloakConfig2);
          await adminClient.authenticate();
          try {
            await adminClient.enableRealmOrganizations(realmName);
            log.info("Organizations enabled for realm during retry", { realmName });
          } catch (orgEnableError) {
            log.warn("Failed to enable organizations for realm during retry", {
              realmName,
              error: orgEnableError?.message || String(orgEnableError),
              errorName: orgEnableError?.name
            });
          }
          try {
            const keycloakOrganization = await adminClient.createOrganization(realmName, {
              name: orgRecord.name,
              domainAliases: []
            });
            if (!orgRecord.ownerAssigned && orgRecord.ownerUsername) {
              try {
                const user = await adminClient.getUserByUsername(realmName, orgRecord.ownerUsername);
                if (user && user.id) {
                  await adminClient.inviteUserToOrganization(realmName, keycloakOrganization.id, user.id);
                  log.info("Owner invited to organization during retry", {
                    username: orgRecord.ownerUsername,
                    userId: user.id,
                    organizationId: keycloakOrganization.id
                  });
                } else {
                  log.warn("User not found during organization retry", {
                    username: orgRecord.ownerUsername,
                    organizationId: keycloakOrganization.id
                  });
                }
              } catch (assignError) {
                log.warn("Failed to assign owner to organization during retry", {
                  username: orgRecord.ownerUsername,
                  organizationId: keycloakOrganization.id,
                  error: assignError?.message || String(assignError)
                });
              }
            }
            await adminDb.update(organizations).set({
              keycloakOrganizationId: keycloakOrganization.id,
              status: "created",
              ownerAssigned: orgRecord.ownerAssigned || false,
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq12(organizations.id, orgRecord.id));
            log.info("Organization retry succeeded", {
              realmId,
              workspaceId,
              keycloakOrganizationId: keycloakOrganization.id
            });
            return c.json({
              success: true,
              message: "Organization created successfully",
              organization: {
                id: keycloakOrganization.id,
                name: orgRecord.name,
                workspaceId: orgRecord.workspaceId,
                status: "created"
              }
            });
          } catch (retryError) {
            await adminDb.update(organizations).set({
              lastError: retryError?.name || "Unknown",
              errorMessage: retryError?.message || String(retryError),
              retryCount: sql2`${organizations.retryCount} + 1`,
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq12(organizations.id, orgRecord.id));
            log.error("Organization retry failed", {
              realmId,
              workspaceId,
              error: retryError?.message
            });
            return c.json({
              success: false,
              error: "Failed to create organization",
              details: retryError.message || String(retryError),
              organization: {
                id: orgRecord.id,
                name: orgRecord.name,
                workspaceId: orgRecord.workspaceId,
                status: "failed",
                retryCount: (orgRecord.retryCount || 0) + 1
              }
            }, 500);
          }
        } catch (error) {
          log.error("Failed to retry organization", { error: error?.message || error });
          return c.json({
            error: "Failed to retry organization",
            details: error.message || String(error)
          }, 500);
        }
      }
      /**
       * List all tenants
       * GET /api/admin/tenants
       * Returns list of tenants from admin database
       */
      async listTenants(c) {
        const auth = checkAdminAuth(c);
        if (!auth.authorized) {
          return c.json({ error: "Unauthorized", details: auth.error }, 403);
        }
        try {
          const adminDb = await getAdminDb();
          const allRealms = await adminDb.select().from(realms).orderBy(realms.provisionedAt);
          const allDatabases = await adminDb.select().from(databases);
          const allOrganizations = await adminDb.select().from(organizations);
          const databasesByRealm = {};
          for (const db of allDatabases) {
            if (!databasesByRealm[db.realmId]) {
              databasesByRealm[db.realmId] = [];
            }
            databasesByRealm[db.realmId].push({
              database: db.databaseName,
              workspaceId: db.workspaceId,
              workspaceName: db.workspaceName,
              dbUser: db.dbUser,
              // Include dbUser (without password for security)
              enabled: db.enabled,
              status: db.status
            });
          }
          const organizationsByRealm = {};
          for (const org of allOrganizations) {
            if (!organizationsByRealm[org.realmId]) {
              organizationsByRealm[org.realmId] = [];
            }
            organizationsByRealm[org.realmId].push({
              id: org.id,
              keycloakOrganizationId: org.keycloakOrganizationId,
              name: org.name,
              alias: org.alias,
              workspaceId: org.workspaceId,
              workspaceName: org.workspaceName,
              status: org.status,
              ownerAssigned: org.ownerAssigned,
              ownerUsername: org.ownerUsername,
              errorMessage: org.errorMessage,
              retryCount: org.retryCount,
              createdAt: org.createdAt
            });
          }
          const tenants = allRealms.map((realm) => ({
            realmId: realm.realmId,
            realmName: realm.realmName,
            displayName: realm.displayName,
            enabled: realm.enabled,
            ownerId: realm.ownerId,
            ownerEmail: realm.ownerEmail,
            ownerFirstName: realm.ownerFirstName,
            ownerLastName: realm.ownerLastName,
            databases: databasesByRealm[realm.realmId] || [],
            organizations: organizationsByRealm[realm.realmId] || [],
            provisionedAt: realm.provisionedAt,
            settings: realm.settings
          }));
          return c.json({
            success: true,
            tenants
          });
        } catch (error) {
          console.error("Failed to list tenants:", error);
          return c.json({
            error: "Failed to list tenants",
            details: error.message || String(error)
          }, 500);
        }
      }
      /**
       * Get a single tenant by realm ID
       * GET /api/admin/tenants/:realmId
       * Returns detailed information about a specific tenant
       */
      async getTenant(c) {
        const auth = checkAdminAuth(c);
        if (!auth.authorized) {
          return c.json({ error: "Unauthorized", details: auth.error }, 403);
        }
        const { Logger } = await import("@oxlayer/capabilities-internal");
        const log = new Logger("admin-get-tenant");
        try {
          const realmId = c.req.param("realmId");
          if (!realmId) {
            return c.json({
              error: "Bad request",
              details: "realmId is required"
            }, 400);
          }
          log.debug("Fetching tenant", { realmId });
          const adminDb = await getAdminDb();
          const realmRecords = await adminDb.select().from(realms).where(eq12(realms.realmId, realmId));
          if (realmRecords.length === 0) {
            return c.json({
              error: "Not found",
              details: `Tenant "${realmId}" not found`
            }, 404);
          }
          const realm = realmRecords[0];
          const realmDatabases = await adminDb.select().from(databases).where(eq12(databases.realmId, realmId));
          const realmOrganizations = await adminDb.select().from(organizations).where(eq12(organizations.realmId, realmId));
          const formattedDatabases = realmDatabases.map((db) => ({
            database: db.databaseName,
            workspaceId: db.workspaceId,
            workspaceName: db.workspaceName,
            dbUser: db.dbUser,
            // Include dbUser (without password for security)
            enabled: db.enabled,
            status: db.status
          }));
          const formattedOrganizations = realmOrganizations.map((org) => ({
            id: org.id,
            keycloakOrganizationId: org.keycloakOrganizationId,
            name: org.name,
            alias: org.alias,
            workspaceId: org.workspaceId,
            workspaceName: org.workspaceName,
            status: org.status,
            ownerAssigned: org.ownerAssigned,
            ownerUsername: org.ownerUsername,
            errorMessage: org.errorMessage,
            retryCount: org.retryCount,
            createdAt: org.createdAt
          }));
          const tenant = {
            realmId: realm.realmId,
            realmName: realm.realmName,
            displayName: realm.displayName,
            enabled: realm.enabled,
            ownerId: realm.ownerId,
            ownerEmail: realm.ownerEmail,
            ownerFirstName: realm.ownerFirstName,
            ownerLastName: realm.ownerLastName,
            databases: formattedDatabases,
            organizations: formattedOrganizations,
            provisionedAt: realm.provisionedAt,
            settings: realm.settings
          };
          return c.json({
            success: true,
            tenant
          });
        } catch (error) {
          log.error("Failed to get tenant", { error: error?.message || error });
          return c.json({
            error: "Failed to get tenant",
            details: error.message || String(error)
          }, 500);
        }
      }
      /**
       * List users in a realm
       * GET /api/admin/users
       */
      async listUsers(c) {
        const auth = checkAdminAuth(c);
        if (!auth.authorized) {
          return c.json({ error: "Unauthorized", details: auth.error }, 403);
        }
        try {
          const { realm } = listUsersSchema.parse({
            realm: c.req.query("realm")
          });
          const { Logger } = await import("@oxlayer/capabilities-internal");
          const log = new Logger("admin-users");
          const users = await this.doListUsers(realm);
          return c.json({
            success: true,
            realm,
            realmExists: true,
            users
          });
        } catch (error) {
          const { Logger } = await import("@oxlayer/capabilities-internal");
          const log = new Logger("admin-users");
          log.error("Failed to list users", { error: error?.message || error });
          if (error?.code === "USER_LIST_FAILED" || error?.message?.includes("404") || error?.message?.includes("Realm not found") || error?.message?.includes("Could not find realm")) {
            log.info("Realm not found, returning empty users list with realmExists flag");
            return c.json({
              success: true,
              realm: c.req.query("realm"),
              realmExists: false,
              users: []
            });
          }
          return c.json({
            error: "Failed to list users",
            details: error.message || String(error)
          }, 500);
        }
      }
      /**
       * List all realms
       * GET /api/admin/realms
       */
      async listRealms(c) {
        const auth = checkAdminAuth(c);
        if (!auth.authorized) {
          return c.json({ error: "Unauthorized", details: auth.error }, 403);
        }
        const { Logger } = await import("@oxlayer/capabilities-internal");
        const log = new Logger("admin-realms");
        try {
          const realms2 = await this.doListRealms();
          return c.json({
            success: true,
            realms: realms2
          });
        } catch (error) {
          log.error("Failed to list realms", { error: error?.message || error });
          return c.json({
            error: "Failed to list realms",
            details: error.message || String(error)
          }, 500);
        }
      }
      // =========================================================================
      // PRIVATE METHODS - Core provisioning logic
      // =========================================================================
      /**
       * Internal: Provision realm in Keycloak
       */
      async doProvisionRealm(config) {
        const { Logger } = await import("@oxlayer/capabilities-internal");
        const log = new Logger("admin-provision");
        log.info("Starting realm provisioning", { realmId: config.realmId, displayName: config.displayName, workspaces: config.workspaces });
        try {
          log.debug("Importing KeycloakAdminClient");
          const { KeycloakAdminClient } = await import("@oxlayer/cli-keycloak-bootstrap");
          log.debug("KeycloakAdminClient imported successfully");
          const keycloakConfig2 = {
            url: process.env.KEYCLOAK_SERVER_URL || "http://localhost:8080",
            admin: {
              username: process.env.KEYCLOAK_ADMIN || "admin",
              password: process.env.KEYCLOAK_ADMIN_PASSWORD || "admin"
            }
          };
          log.debug("Keycloak config", { url: keycloakConfig2.url, username: keycloakConfig2.admin.username });
          const adminClient = new KeycloakAdminClient(keycloakConfig2);
          log.debug("Authenticating with Keycloak admin API");
          await adminClient.authenticate();
          log.debug("Authentication successful");
          const realmName = `globex_${config.realmId}`;
          log.debug("Creating realm", { realmId: config.realmId, realmName });
          await adminClient.createRealm({
            name: realmName,
            displayName: config.displayName,
            type: "client",
            sslRequired: "external",
            organizationsEnabled: true,
            security: {
              loginWithEmailAllowed: true,
              registrationEmailAsUsername: true,
              duplicateEmailsAllowed: false,
              resetPasswordAllowed: true,
              bruteForceProtected: true
            }
          });
          log.info("Realm created successfully", { realmId: config.realmId, realmName });
          let organizationsEnabled = false;
          try {
            await adminClient.enableRealmOrganizations(realmName);
            organizationsEnabled = true;
            log.info("Organizations enabled for realm", { realmName });
          } catch (orgEnableError) {
            log.warn("Failed to enable organizations for realm", {
              realmName,
              error: orgEnableError?.message || String(orgEnableError),
              errorName: orgEnableError?.name
            });
          }
          const roles = [
            { name: "owner", description: `B2B client owner for ${config.displayName}` },
            { name: "supervisor", description: `B2B operations supervisor for ${config.displayName}` },
            { name: "manager", description: `Company manager for ${config.displayName}` },
            { name: "candidate", description: `End user for ${config.displayName}` }
          ];
          log.debug("Creating roles", { roles: roles.map((r) => r.name) });
          for (const role of roles) {
            await adminClient.createRole(realmName, role);
            log.debug("Role created", { role: role.name });
          }
          const baseUrl = "http://localhost";
          const clients = [
            {
              clientId: `globex_people`,
              name: `globex_people`,
              description: "People operations web app",
              enabled: true,
              publicClient: true,
              standardFlowEnabled: true,
              directAccessGrantsEnabled: true,
              redirectUris: [
                `${baseUrl}:5176/*`
              ],
              postLogoutRedirectUris: [
                `${baseUrl}:5176`
              ],
              webOrigins: [
                `${baseUrl}:5176`
              ],
              protocol: "openid-connect",
              attributes: {
                "pkce.code.challenge.method": "S256"
              }
            },
            {
              clientId: `globex_manager`,
              name: `globex_manager`,
              description: "Manager web app",
              enabled: true,
              publicClient: true,
              standardFlowEnabled: true,
              directAccessGrantsEnabled: true,
              redirectUris: [
                `${baseUrl}:5177/*`
              ],
              postLogoutRedirectUris: [
                `${baseUrl}:5177`
              ],
              webOrigins: [
                `${baseUrl}:5177`
              ],
              protocol: "openid-connect",
              attributes: {
                "pkce.code.challenge.method": "S256"
              }
            },
            {
              clientId: `globex_app`,
              name: `globex_app`,
              description: "Candidate portal app",
              enabled: true,
              publicClient: true,
              standardFlowEnabled: true,
              directAccessGrantsEnabled: false,
              redirectUris: [
                `${baseUrl}:5178/*`
              ],
              postLogoutRedirectUris: [
                `${baseUrl}:5178`
              ],
              webOrigins: [
                `${baseUrl}:5178`
              ],
              protocol: "openid-connect",
              attributes: {
                "pkce.code.challenge.method": "S256"
              }
            }
          ];
          log.debug("Creating clients", { clients: clients.map((c) => c.clientId) });
          for (const client of clients) {
            try {
              await adminClient.createClient(realmName, client);
              log.debug("Client created", { clientId: client.clientId });
            } catch (clientError) {
              log.warn("Client creation skipped (may already exist)", {
                clientId: client.clientId,
                error: clientError?.message
              });
            }
          }
          const protocolMappers = [
            {
              name: "realm-mapper",
              protocol: "openid-connect",
              protocolMapper: "oidc-usermodel-attribute-mapper",
              config: {
                "access.token.claim": "true",
                "claim.name": "realm",
                "id.token.claim": "true",
                "jsonType.label": "String",
                "user.attribute": "realm",
                "introspection.token.claim": "true",
                "userinfo.token.claim": "true"
              }
            },
            {
              name: "organization-mapper",
              protocol: "openid-connect",
              protocolMapper: "oidc-usermodel-attribute-mapper",
              config: {
                "access.token.claim": "true",
                "claim.name": "organization",
                "id.token.claim": "true",
                "jsonType.label": "JSON",
                "introspection.token.claim": "true",
                "userinfo.token.claim": "true",
                "multivalued": "true"
              }
            },
            {
              name: "workspace-mapper",
              protocol: "openid-connect",
              protocolMapper: "oidc-usermodel-attribute-mapper",
              config: {
                "access.token.claim": "true",
                "claim.name": "workspace",
                "id.token.claim": "true",
                "jsonType.label": "JSON",
                "introspection.token.claim": "true",
                "userinfo.token.claim": "true"
              }
            },
            {
              name: "roles-mapper",
              protocol: "openid-connect",
              protocolMapper: "oidc-usermodel-realm-role-mapper",
              config: {
                "access.token.claim": "true",
                "claim.name": "roles",
                "id.token.claim": "true",
                "jsonType.label": "String",
                "introspection.token.claim": "true",
                "userinfo.token.claim": "true",
                "multivalued": "true"
              }
            }
          ];
          log.debug("Adding protocol mappers to web client");
          const webClientId = `globex-web`;
          for (const mapper of protocolMappers) {
            try {
              await adminClient.createProtocolMapper(realmName, webClientId, mapper);
              log.debug("Protocol mapper created", { mapper: mapper.name });
            } catch (mapperError) {
              log.warn("Protocol mapper creation skipped (may already exist)", {
                mapper: mapper.name,
                error: mapperError?.message
              });
            }
          }
          const adminDb = await getAdminDb();
          const ownerUsername = config.owner.email;
          try {
            await adminDb.insert(realms).values({
              realmId: config.realmId,
              realmName,
              displayName: config.displayName,
              enabled: true,
              ownerId: ownerUsername,
              ownerEmail: config.owner.email,
              ownerFirstName: config.owner.firstName,
              ownerLastName: config.owner.lastName,
              settings: {
                organizationsEnabled
              }
            }).onConflictDoNothing();
            log.info("Realm registered in admin database", { realmId: config.realmId });
          } catch (dbError) {
            log.warn("Failed to register realm in admin database", { error: dbError?.message });
          }
          const createdOrganizations = [];
          let hasOrganizationFailures = false;
          for (const workspace of config.workspaces) {
            log.debug("Creating organization for workspace", { workspaceId: workspace.id, workspaceName: workspace.name });
            try {
              const keycloakOrganization = await adminClient.createOrganization(realmName, {
                name: workspace.name,
                domainAliases: workspace.domainAliases || []
              });
              try {
                log.debug("Attempting to save organization to database", {
                  workspaceId: workspace.id,
                  keycloakOrganizationId: keycloakOrganization.id
                });
                await adminDb.insert(organizations).values({
                  realmId: config.realmId,
                  workspaceId: workspace.id,
                  workspaceName: workspace.name,
                  keycloakOrganizationId: keycloakOrganization.id,
                  name: workspace.name,
                  alias: workspace.alias,
                  ownerAssigned: false,
                  // Will be assigned after user creation
                  ownerUsername,
                  status: "created"
                }).onConflictDoNothing();
                log.debug("Organization saved to admin database", { workspaceId: workspace.id, keycloakOrganizationId: keycloakOrganization.id });
              } catch (dbSaveError) {
                log.warn("Failed to save organization to admin database", {
                  workspaceId: workspace.id,
                  errorMessage: dbSaveError?.message,
                  errorName: dbSaveError?.name,
                  errorCode: dbSaveError?.code,
                  errorConstraint: dbSaveError?.constraint,
                  errorDetail: dbSaveError?.detail,
                  errorTable: dbSaveError?.table,
                  fullError: JSON.stringify(dbSaveError)
                });
              }
              createdOrganizations.push({
                id: keycloakOrganization.id,
                name: workspace.name,
                workspaceId: workspace.id,
                status: "created"
              });
              log.info("Keycloak organization created", { organizationId: keycloakOrganization.id, name: workspace.name });
            } catch (orgError) {
              const errorMsg = orgError?.message || String(orgError);
              log.error("Failed to create organization for workspace", {
                workspaceId: workspace.id,
                errorMessage: errorMsg,
                errorName: orgError?.name,
                errorCode: orgError?.code
              });
              try {
                await adminDb.insert(organizations).values({
                  realmId: config.realmId,
                  workspaceId: workspace.id,
                  workspaceName: workspace.name,
                  name: workspace.name,
                  alias: workspace.alias,
                  ownerAssigned: false,
                  status: "failed",
                  lastError: errorMsg,
                  errorMessage: errorMsg,
                  retryCount: 0
                }).onConflictDoNothing();
                log.info("Failed organization saved to admin database for retry", { workspaceId: workspace.id });
              } catch (dbSaveError) {
                log.warn("Failed to save failed organization to admin database", { workspaceId: workspace.id, error: dbSaveError?.message });
              }
              createdOrganizations.push({
                id: "",
                name: workspace.name,
                workspaceId: workspace.id,
                status: "failed",
                error: errorMsg
              });
              hasOrganizationFailures = true;
            }
          }
          log.debug("Creating owner user", { email: config.owner.email });
          const ownerUserId = await adminClient.createUser(realmName, {
            username: ownerUsername,
            email: config.owner.email,
            firstName: config.owner.firstName,
            lastName: config.owner.lastName,
            enabled: true,
            emailVerified: false,
            credentials: [{
              type: "password",
              value: config.owner.temporaryPassword,
              temporary: true
            }],
            requiredActions: ["UPDATE_PASSWORD"]
          });
          log.info("Owner user created", { username: ownerUsername, userId: ownerUserId });
          log.debug("Assigning owner role to user", { username: ownerUsername });
          const ownerRole = roles.find((r) => r.name === "owner");
          if (ownerRole) {
            await adminClient.assignRealmRoles(realmName, ownerUsername, [ownerRole]);
            log.info("Owner role assigned", { username: ownerUsername, role: "owner" });
          }
          for (const org of createdOrganizations) {
            if (org.status === "created" && org.id) {
              try {
                await adminClient.inviteUserToOrganization(realmName, org.id, ownerUserId);
                log.info("Owner invited to organization", { username: ownerUsername, userId: ownerUserId, organizationId: org.id, organizationName: org.name });
                try {
                  await adminDb.update(organizations).set({ ownerAssigned: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq12(organizations.keycloakOrganizationId, org.id));
                } catch (dbUpdateError) {
                  log.warn("Failed to update organization ownerAssigned status", { organizationId: org.id, error: dbUpdateError?.message });
                }
              } catch (assignError) {
                log.error(assignError);
                log.warn("Failed to invite owner to organization", {
                  username: ownerUsername,
                  organizationId: org.id,
                  organizationName: org.name,
                  error: assignError?.message
                });
              }
            }
          }
          const workspaceIds = config.workspaces.map((w) => w.id || crypto.randomUUID());
          const orgStatus = hasOrganizationFailures ? "partial" : "completed";
          log.info("Realm provisioning completed", {
            realmId: config.realmId,
            realmName,
            workspaceIds,
            organizationsCount: createdOrganizations.length,
            organizationsStatus: orgStatus,
            hasOrganizationFailures
          });
          return {
            id: config.realmId,
            name: realmName,
            displayName: config.displayName,
            status: "created",
            roles: {
              status: "created",
              roles: roles.map((r) => r.name)
            },
            clients: {
              status: "created",
              clients: ["globex-api", "globex-web", "example-app"]
            },
            owner: {
              status: "created",
              username: ownerUsername,
              email: config.owner.email,
              firstName: config.owner.firstName,
              lastName: config.owner.lastName
            },
            organizations: {
              created: createdOrganizations,
              status: orgStatus
            },
            // Return workspace IDs for database creation reference
            workspaces: workspaceIds
          };
        } catch (err) {
          log.error("Realm provisioning failed", {
            error: err?.message || err,
            code: err?.code,
            name: err?.name,
            stack: err?.stack
          });
          throw err;
        }
      }
      /**
       * Internal: Create tenant database with tenant-specific user
       */
      async doCreateDatabase(realm, workspaceId) {
        const dbName = `globex_workspace_${realm}_${workspaceId}`;
        const dbUser = `workspace_${this.generateRandomDigits(6)}`;
        const sql4 = getMasterConnection2();
        try {
          const existingCheck = await sql4.unsafe(`
        SELECT 1 FROM pg_database WHERE datname = $1
      `, [dbName]);
          if (existingCheck.length > 0) {
            const adminDb = await getAdminDb();
            const dbRecords = await adminDb.select({ dbUser: databases.dbUser, dbPassword: databases.dbPassword }).from(databases).where(eq12(databases.workspaceId, workspaceId)).limit(1);
            if (dbRecords.length > 0 && dbRecords[0].dbUser && dbRecords[0].dbPassword) {
              return { database: dbName, existed: true, dbUser: dbRecords[0].dbUser, dbPassword: dbRecords[0].dbPassword };
            }
            return { database: dbName, existed: true };
          }
          const dbPassword = this.generateSecurePassword();
          await sql4.unsafe(`CREATE DATABASE "${dbName}" ENCODING 'UTF8'`);
          await sql4.unsafe(`CREATE USER "${dbUser}" WITH PASSWORD '${dbPassword}'`);
          const dbSql = postgres4({
            host: process.env.POSTGRES_ADMIN_HOST || process.env.POSTGRES_HOST,
            port: Number(process.env.POSTGRES_ADMIN_PORT || process.env.POSTGRES_PORT) || 5432,
            database: "postgres",
            user: process.env.POSTGRES_ADMIN_USER || process.env.POSTGRES_USER,
            password: process.env.POSTGRES_ADMIN_PASSWORD || process.env.POSTGRES_PASSWORD,
            max: 1
          });
          try {
            await dbSql.unsafe(`GRANT CONNECT ON DATABASE "${dbName}" TO "${dbUser}"`);
            await dbSql.unsafe(`GRANT ALL ON SCHEMA public TO "${dbUser}"`);
            await dbSql.unsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${dbUser}"`);
            await dbSql.unsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${dbUser}"`);
            await dbSql.unsafe(`GRANT ALL ON ALL TABLES IN SCHEMA public TO "${dbUser}"`);
            await dbSql.unsafe(`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO "${dbUser}"`);
          } finally {
            await dbSql.end();
          }
          return { database: dbName, existed: false, dbUser, dbPassword };
        } finally {
          await sql4.end();
        }
      }
      /**
       * Generate a secure random password for tenant database users
       * Returns a 32-character alphanumeric string
       */
      generateSecurePassword() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, (byte) => chars[byte % chars.length]).join("");
      }
      /**
       * Generate random digits for username
       * Returns a string of random digits with the specified length
       */
      generateRandomDigits(length) {
        const digits = "0123456789";
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, (byte) => digits[byte % digits.length]).join("");
      }
      /**
       * Internal: Run migrations on tenant database
       *
       * Note: This method connects directly to the database without using
       * getTenantDatabase() because there's no AsyncLocalStorage context
       * during admin operations.
       */
      async doMigrateDatabase(realm, workspaceId) {
        const dbName = `globex_workspace_${realm}_${workspaceId}`;
        const host = process.env.POSTGRES_HOST || "localhost";
        const port = Number(process.env.POSTGRES_PORT) || 5432;
        const user = process.env.POSTGRES_USER || "postgres";
        const password = process.env.POSTGRES_PASSWORD || "postgres";
        const sql4 = postgres4({
          host,
          port,
          database: dbName,
          user,
          password,
          max: 1
        });
        try {
          const { createTableSQLString: createTableSQLString2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
          await sql4.unsafe(createTableSQLString2);
        } finally {
          await sql4.end();
        }
      }
      /**
       * Internal: List users in a realm
       */
      async doListUsers(realm) {
        const { KeycloakAdminClient } = await import("@oxlayer/cli-keycloak-bootstrap");
        const keycloakConfig2 = {
          url: process.env.KEYCLOAK_SERVER_URL || "http://localhost:8080",
          admin: {
            username: process.env.KEYCLOAK_ADMIN || "admin",
            password: process.env.KEYCLOAK_ADMIN_PASSWORD || "admin"
          }
        };
        const adminClient = new KeycloakAdminClient(keycloakConfig2);
        await adminClient.authenticate();
        const realmName = realm.startsWith("globex_") ? realm : `globex_${realm}`;
        const users = await adminClient.listUsers(realmName, 100);
        const usersWithRoles = await Promise.all(
          users.map(async (user) => {
            const roles = await adminClient.getUserRoles(realmName, user.id);
            return {
              id: user.id,
              username: user.username,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              enabled: user.enabled,
              emailVerified: user.emailVerified,
              roles: roles.map((r) => r.name)
            };
          })
        );
        return usersWithRoles;
      }
      /**
       * Internal: List all realms from admin database
       * The admin database is the source of truth for the control panel
       */
      async doListRealms() {
        const { Logger } = await import("@oxlayer/capabilities-internal");
        const log = new Logger("admin-realms");
        const adminDb = await getAdminDb();
        try {
          const allRealmRecords = await adminDb.select().from(realms).orderBy(realms.provisionedAt);
          const allDatabases = await adminDb.select().from(databases);
          const databasesByRealm = {};
          for (const db of allDatabases) {
            if (!databasesByRealm[db.realmId]) {
              databasesByRealm[db.realmId] = [];
            }
            databasesByRealm[db.realmId].push({
              database: db.databaseName,
              workspaceId: db.workspaceId,
              workspaceName: db.workspaceName,
              dbUser: db.dbUser,
              // Include dbUser (without password for security)
              enabled: db.enabled,
              status: db.status
            });
          }
          const realmsList = allRealmRecords.map((realm) => ({
            id: realm.realmName,
            displayName: realm.displayName,
            realmId: realm.realmId,
            enabled: realm.enabled,
            ownerId: realm.ownerId,
            ownerEmail: realm.ownerEmail,
            databases: databasesByRealm[realm.realmId] || [],
            provisionedAt: realm.provisionedAt,
            syncStatus: realm.syncStatus
          }));
          return realmsList;
        } catch (err) {
          log.error("Failed to list realms from admin database", { error: err?.message || err });
          throw err;
        }
      }
      /**
       * Internal: Get all realms from Keycloak
       */
      async doGetAllRealms(adminClient) {
        try {
          const response = await fetch(
            `${process.env.KEYCLOAK_SERVER_URL || "http://localhost:8080"}/admin/realms`,
            {
              headers: {
                Authorization: `Bearer ${adminClient.token}`
              }
            }
          );
          if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to list realms: ${response.status} ${error}`);
          }
          const realms2 = await response.json();
          return realms2 || [];
        } catch (err) {
          const { Logger } = await import("@oxlayer/capabilities-internal");
          const log = new Logger("admin-realms");
          log.error("Failed to get realms from Keycloak", { error: err?.message || err });
          throw err;
        }
      }
      /**
       * Delete entire tenant (cascade delete everything)
       * DELETE /api/admin/tenants/:realmId
       */
      async deleteTenant(c) {
        const auth = checkAdminAuth(c);
        if (!auth.authorized) {
          return c.json({ error: "Unauthorized", details: auth.error }, 403);
        }
        const { Logger } = await import("@oxlayer/capabilities-internal");
        const log = new Logger("admin-delete-tenant");
        try {
          const realmId = c.req.param("realmId");
          log.info("Starting tenant deletion", { realmId });
          const adminDb = await getAdminDb();
          const realmDatabases = await adminDb.select().from(databases).where(eq12(databases.realmId, realmId));
          const sql4 = getMasterConnection2();
          try {
            for (const db of realmDatabases) {
              log.debug("Dropping database", { database: db.databaseName });
              await sql4.unsafe(`DROP DATABASE IF EXISTS "${db.databaseName}"`);
              log.info("Database dropped", { database: db.databaseName });
            }
          } finally {
            await sql4.end();
          }
          const { KeycloakAdminClient } = await import("@oxlayer/cli-keycloak-bootstrap");
          const keycloakConfig2 = {
            url: process.env.KEYCLOAK_SERVER_URL || "http://localhost:8080",
            admin: {
              username: process.env.KEYCLOAK_ADMIN || "admin",
              password: process.env.KEYCLOAK_ADMIN_PASSWORD || "admin"
            }
          };
          const adminClient = new KeycloakAdminClient(keycloakConfig2);
          await adminClient.authenticate();
          const realmName = `globex_${realmId}`;
          await adminClient.deleteRealm(realmName);
          log.info("Keycloak realm deleted", { realmName });
          await adminDb.delete(organizations).where(eq12(organizations.realmId, realmId));
          await adminDb.delete(databases).where(eq12(databases.realmId, realmId));
          await adminDb.delete(realms).where(eq12(realms.realmId, realmId));
          log.info("Admin database entries deleted", { realmId });
          log.info("Tenant deletion completed", { realmId });
          return c.json({
            success: true,
            message: `Tenant "${realmId}" and all resources deleted successfully`
          });
        } catch (error) {
          log.error("Failed to delete tenant", { error: error?.message || error });
          return c.json({
            error: "Failed to delete tenant",
            details: error.message || String(error)
          }, 500);
        }
      }
      /**
       * Delete only the Keycloak realm
       * DELETE /api/admin/tenants/:realmId/realm
       */
      async deleteRealm(c) {
        const auth = checkAdminAuth(c);
        if (!auth.authorized) {
          return c.json({ error: "Unauthorized", details: auth.error }, 403);
        }
        const { Logger } = await import("@oxlayer/capabilities-internal");
        const log = new Logger("admin-delete-realm");
        try {
          const realmId = c.req.param("realmId");
          log.info("Starting realm deletion", { realmId });
          const { KeycloakAdminClient } = await import("@oxlayer/cli-keycloak-bootstrap");
          const keycloakConfig2 = {
            url: process.env.KEYCLOAK_SERVER_URL || "http://localhost:8080",
            admin: {
              username: process.env.KEYCLOAK_ADMIN || "admin",
              password: process.env.KEYCLOAK_ADMIN_PASSWORD || "admin"
            }
          };
          const adminClient = new KeycloakAdminClient(keycloakConfig2);
          await adminClient.authenticate();
          const realmName = `globex_${realmId}`;
          await adminClient.deleteRealm(realmName);
          log.info("Keycloak realm deleted", { realmName });
          log.info("Realm deletion completed", { realmId });
          return c.json({
            success: true,
            message: `Realm "${realmId}" deleted successfully`
          });
        } catch (error) {
          log.error("Failed to delete realm", { error: error?.message || error });
          return c.json({
            error: "Failed to delete realm",
            details: error.message || String(error)
          }, 500);
        }
      }
      /**
       * Delete database(s)
       * DELETE /api/admin/databases
       */
      async deleteDatabase(c) {
        const auth = checkAdminAuth(c);
        if (!auth.authorized) {
          return c.json({ error: "Unauthorized", details: auth.error }, 403);
        }
        const { Logger } = await import("@oxlayer/capabilities-internal");
        const log = new Logger("admin-delete-database");
        try {
          const body = await c.req.json();
          const { realmId, workspaceId } = body;
          if (!realmId) {
            return c.json({ error: "Bad request", details: "realmId is required" }, 400);
          }
          log.info("Starting database deletion", { realmId, workspaceId });
          const adminDb = await getAdminDb();
          let databasesToDelete = await adminDb.select().from(databases).where(eq12(databases.realmId, realmId));
          if (workspaceId) {
            databasesToDelete = databasesToDelete.filter((db) => db.workspaceId === workspaceId);
          }
          if (databasesToDelete.length === 0) {
            return c.json({
              success: true,
              deleted: []
            });
          }
          const sql4 = getMasterConnection2();
          const deleted = [];
          try {
            for (const db of databasesToDelete) {
              log.debug("Dropping database", { database: db.databaseName });
              await sql4.unsafe(`DROP DATABASE IF EXISTS "${db.databaseName}"`);
              deleted.push({ workspaceId: db.workspaceId, database: db.databaseName });
              log.info("Database dropped", { database: db.databaseName });
              await adminDb.delete(databases).where(eq12(databases.databaseName, db.databaseName));
            }
          } finally {
            await sql4.end();
          }
          log.info("Database deletion completed", { realmId, workspaceId, count: deleted.length });
          return c.json({
            success: true,
            deleted
          });
        } catch (error) {
          log.error("Failed to delete database", { error: error?.message || error });
          return c.json({
            error: "Failed to delete database",
            details: error.message || String(error)
          }, 500);
        }
      }
      /**
       * Recreate realm
       * POST /api/admin/tenants/:realmId/realm/recreate
       */
      async recreateRealm(c) {
        const auth = checkAdminAuth(c);
        if (!auth.authorized) {
          return c.json({ error: "Unauthorized", details: auth.error }, 403);
        }
        const { Logger } = await import("@oxlayer/capabilities-internal");
        const log = new Logger("admin-recreate-realm");
        try {
          const realmId = c.req.param("realmId");
          log.info("Starting realm recreation", { realmId });
          const adminDb = await getAdminDb();
          const realmRecords = await adminDb.select().from(realms).where(eq12(realms.realmId, realmId));
          if (realmRecords.length === 0) {
            return c.json({
              error: "Not found",
              details: `Realm "${realmId}" not found in database`
            }, 404);
          }
          const realmRecord = realmRecords[0];
          const orgRecords = await adminDb.select().from(organizations).where(eq12(organizations.realmId, realmId));
          const { KeycloakAdminClient } = await import("@oxlayer/cli-keycloak-bootstrap");
          const keycloakConfig2 = {
            url: process.env.KEYCLOAK_SERVER_URL || "http://localhost:8080",
            admin: {
              username: process.env.KEYCLOAK_ADMIN || "admin",
              password: process.env.KEYCLOAK_ADMIN_PASSWORD || "admin"
            }
          };
          const adminClient = new KeycloakAdminClient(keycloakConfig2);
          await adminClient.authenticate();
          const realmName = `globex_${realmId}`;
          await adminClient.createRealm({
            name: realmName,
            displayName: realmRecord.displayName,
            type: "client",
            sslRequired: "external",
            organizationsEnabled: true,
            security: {
              loginWithEmailAllowed: true,
              registrationEmailAsUsername: true,
              duplicateEmailsAllowed: false,
              resetPasswordAllowed: true,
              bruteForceProtected: true
            }
          });
          log.info("Realm created", { realmName });
          try {
            await adminClient.enableRealmOrganizations(realmName);
            log.info("Organizations enabled", { realmName });
          } catch (err) {
            log.warn("Failed to enable organizations", { error: err?.message });
          }
          const roles = [
            { name: "owner", description: `B2B client owner for ${realmRecord.displayName}` },
            { name: "supervisor", description: `B2B operations supervisor for ${realmRecord.displayName}` },
            { name: "manager", description: `Company manager for ${realmRecord.displayName}` },
            { name: "candidate", description: `End user for ${realmRecord.displayName}` }
          ];
          for (const role of roles) {
            await adminClient.createRole(realmName, role);
          }
          log.info("Roles created", { roles: roles.map((r) => r.name) });
          const baseUrl = "http://localhost";
          const clients = [
            {
              clientId: `globex_people`,
              name: `globex_people`,
              description: "People operations web app",
              enabled: true,
              publicClient: true,
              standardFlowEnabled: true,
              directAccessGrantsEnabled: true,
              redirectUris: [`${baseUrl}:5176/*`],
              postLogoutRedirectUris: [`${baseUrl}:5176`],
              webOrigins: [`${baseUrl}:5176`],
              protocol: "openid-connect",
              attributes: {
                "pkce.code.challenge.method": "S256"
              }
            },
            {
              clientId: `globex_manager`,
              name: `globex_manager`,
              description: "Manager web app",
              enabled: true,
              publicClient: true,
              standardFlowEnabled: true,
              directAccessGrantsEnabled: true,
              redirectUris: [`${baseUrl}:5177/*`],
              postLogoutRedirectUris: [`${baseUrl}:5177`],
              webOrigins: [`${baseUrl}:5177`],
              protocol: "openid-connect",
              attributes: {
                "pkce.code.challenge.method": "S256"
              }
            },
            {
              clientId: `globex_app`,
              name: `globex_app`,
              description: "Candidate portal app",
              enabled: true,
              publicClient: true,
              standardFlowEnabled: true,
              directAccessGrantsEnabled: false,
              redirectUris: [`${baseUrl}:5178/*`],
              postLogoutRedirectUris: [`${baseUrl}:5178`],
              webOrigins: [`${baseUrl}:5178`],
              protocol: "openid-connect",
              attributes: {
                "pkce.code.challenge.method": "S256"
              }
            }
          ];
          for (const client of clients) {
            try {
              await adminClient.createClient(realmName, client);
            } catch (clientError) {
              log.warn("Client creation skipped", { clientId: client.clientId, error: clientError?.message });
            }
          }
          log.info("Clients created", { clients: clients.map((c2) => c2.clientId) });
          for (const org of orgRecords) {
            try {
              const keycloakOrg = await adminClient.createOrganization(realmName, {
                name: org.name,
                domainAliases: []
              });
              await adminDb.update(organizations).set({ keycloakOrganizationId: keycloakOrg.id, status: "created" }).where(eq12(organizations.id, org.id));
              log.info("Organization recreated", { name: org.name });
            } catch (orgError) {
              log.warn("Organization recreation failed", { name: org.name, error: orgError?.message });
            }
          }
          log.info("Realm recreation completed", { realmId });
          return c.json({
            success: true,
            message: `Realm "${realmId}" recreated successfully`,
            realm: {
              id: realmId,
              name: realmName,
              displayName: realmRecord.displayName
            }
          });
        } catch (error) {
          log.error("Failed to recreate realm", { error: error?.message || error });
          return c.json({
            error: "Failed to recreate realm",
            details: error.message || String(error)
          }, 500);
        }
      }
      /**
       * Recreate database
       * POST /api/admin/databases/recreate
       */
      async recreateDatabase(c) {
        const auth = checkAdminAuth(c);
        if (!auth.authorized) {
          return c.json({ error: "Unauthorized", details: auth.error }, 403);
        }
        const { Logger } = await import("@oxlayer/capabilities-internal");
        const log = new Logger("admin-recreate-database");
        try {
          const body = await c.req.json();
          const { realmId, workspaceId } = body;
          if (!realmId || !workspaceId) {
            return c.json({
              error: "Bad request",
              details: "realmId and workspaceId are required"
            }, 400);
          }
          log.info("Starting database recreation", { realmId, workspaceId });
          const adminDb = await getAdminDb();
          const dbRecords = await adminDb.select().from(databases).where(
            and9(eq12(databases.realmId, realmId), eq12(databases.workspaceId, workspaceId))
          );
          const databaseName = `globex_workspace_${realmId}_${workspaceId}`;
          let workspaceName = workspaceId;
          let needsAdminRecord = false;
          if (dbRecords.length === 0) {
            needsAdminRecord = true;
            const orgRecords = await adminDb.select().from(organizations).where(
              and9(eq12(organizations.realmId, realmId), eq12(organizations.workspaceId, workspaceId))
            );
            if (orgRecords.length > 0) {
              workspaceName = orgRecords[0].workspaceName;
              log.info("Workspace name found from organizations", { workspaceId, workspaceName });
            } else {
              log.warn("Workspace name not found, using workspaceId as name", { workspaceId });
            }
          } else {
            workspaceName = dbRecords[0].workspaceName;
          }
          const sql4 = getMasterConnection2();
          try {
            log.debug("Terminating existing connections", { database: databaseName });
            await sql4.unsafe(`
          SELECT pg_terminate_backend(pg_stat_activity.pid)
          FROM pg_stat_activity
          WHERE pg_stat_activity.datname = $1
          AND pid <> pg_backend_pid();
        `, [databaseName]);
            log.debug("Dropping existing database", { database: databaseName });
            await sql4.unsafe(`DROP DATABASE IF EXISTS "${databaseName}"`);
            log.info("Existing database dropped", { database: databaseName });
            log.debug("Creating new database", { database: databaseName });
            await sql4.unsafe(`CREATE DATABASE "${databaseName}" ENCODING 'UTF8'`);
            log.info("New database created", { database: databaseName });
            const dbUser = `workspace_${this.generateRandomDigits(6)}`;
            const dbPassword = this.generateSecurePassword();
            await sql4.unsafe(`DROP USER IF EXISTS "${dbUser}"`);
            log.debug("Dropped existing user if present", { dbUser });
            await sql4.unsafe(`CREATE USER "${dbUser}" WITH PASSWORD '${dbPassword}'`);
            log.info("Tenant user created with fresh credentials", { dbUser });
            const dbSql = postgres4({
              host: process.env.POSTGRES_ADMIN_HOST || process.env.POSTGRES_HOST,
              port: Number(process.env.POSTGRES_ADMIN_PORT || process.env.POSTGRES_PORT) || 5432,
              database: "postgres",
              user: process.env.POSTGRES_ADMIN_USER || process.env.POSTGRES_USER,
              password: process.env.POSTGRES_ADMIN_PASSWORD || process.env.POSTGRES_PASSWORD,
              max: 1
            });
            try {
              await dbSql.unsafe(`GRANT CONNECT ON DATABASE "${databaseName}" TO "${dbUser}"`);
              await dbSql.unsafe(`GRANT ALL ON SCHEMA public TO "${dbUser}"`);
              await dbSql.unsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${dbUser}"`);
              await dbSql.unsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${dbUser}"`);
              await dbSql.unsafe(`GRANT ALL ON ALL TABLES IN SCHEMA public TO "${dbUser}"`);
              await dbSql.unsafe(`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO "${dbUser}"`);
              log.info("Privileges granted to tenant user", { dbUser, database: databaseName });
            } finally {
              await dbSql.end();
            }
            c._tenantCredentials = { dbUser, dbPassword };
          } catch (dbError) {
            log.error("Database operation failed", {
              error: dbError?.message || String(dbError),
              code: dbError?.code,
              name: dbError?.name,
              detail: dbError?.detail,
              database: databaseName
            });
            throw dbError;
          } finally {
            await sql4.end();
          }
          await this.doMigrateDatabase(realmId, workspaceId);
          log.info("Migrations completed", { database: databaseName });
          const credentials = c._tenantCredentials;
          if (needsAdminRecord) {
            await adminDb.insert(databases).values({
              databaseName,
              realmId,
              workspaceId,
              workspaceName,
              domainAliases: [],
              dbUser: credentials?.dbUser,
              dbPassword: credentials?.dbPassword,
              enabled: true,
              status: "active"
            });
            log.info("Database record created in admin database", { database: databaseName });
          } else {
            await adminDb.update(databases).set({
              enabled: true,
              status: "active",
              dbUser: credentials?.dbUser,
              dbPassword: credentials?.dbPassword
            }).where(eq12(databases.databaseName, databaseName));
            log.info("Database record updated with fresh credentials", { database: databaseName });
          }
          log.info("Database recreation completed", { realmId, workspaceId, database: databaseName });
          return c.json({
            success: true,
            message: `Database recreated successfully`,
            database: databaseName,
            status: "active"
          });
        } catch (error) {
          log.error("Failed to recreate database", { error: error?.message || error });
          return c.json({
            error: "Failed to recreate database",
            details: error.message || String(error)
          }, 500);
        }
      }
      /**
       * Rotate tenant database credentials
       * POST /api/admin/databases/rotate-credentials
       *
       * Updates the database user password for a tenant.
       * Allows UI to change the password or auto-generate a new one.
       */
      async rotateCredentials(c) {
        const auth = checkAdminAuth(c);
        if (!auth.authorized) {
          return c.json({ error: "Unauthorized", details: auth.error }, 403);
        }
        const { Logger } = await import("@oxlayer/capabilities-internal");
        const log = new Logger("admin-rotate-credentials");
        try {
          const body = await c.req.json();
          const { workspaceId, newPassword } = body;
          if (!workspaceId) {
            return c.json({
              error: "Bad request",
              details: "workspaceId is required"
            }, 400);
          }
          log.info("Starting credential rotation", { workspaceId });
          const adminDb = await getAdminDb();
          const dbRecords = await adminDb.select().from(databases).where(eq12(databases.workspaceId, workspaceId));
          if (dbRecords.length === 0) {
            return c.json({
              error: "Not found",
              details: `Database record not found for workspace "${workspaceId}"`
            }, 404);
          }
          const dbRecord = dbRecords[0];
          if (!dbRecord.dbUser) {
            return c.json({
              error: "Bad request",
              details: "Database has no tenant user configured"
            }, 400);
          }
          const dbUser = dbRecord.dbUser;
          const dbName = dbRecord.databaseName;
          const dbPassword = newPassword || this.generateSecurePassword();
          log.info("Rotating credentials for user", { dbUser, database: dbName });
          const sql4 = getMasterConnection2();
          try {
            await sql4.unsafe(`ALTER USER "${dbUser}" WITH PASSWORD '${dbPassword}'`);
            log.info("PostgreSQL user password updated", { dbUser });
          } finally {
            await sql4.end();
          }
          await adminDb.update(databases).set({ dbPassword }).where(eq12(databases.workspaceId, workspaceId));
          log.info("Admin database record updated", { workspaceId });
          const { clearCredentialsCache: clearCredentialsCache2 } = await Promise.resolve().then(() => (init_database_resolver_config(), database_resolver_config_exports));
          clearCredentialsCache2(workspaceId);
          log.info("Credentials cache cleared", { workspaceId });
          log.info("Credential rotation completed", { workspaceId, dbUser });
          return c.json({
            success: true,
            message: `Credentials rotated successfully for workspace "${workspaceId}"`,
            workspaceId,
            dbUser,
            passwordGenerated: !newPassword
            // true if auto-generated, false if provided by user
          });
        } catch (error) {
          log.error("Failed to rotate credentials", { error: error?.message || error });
          return c.json({
            error: "Failed to rotate credentials",
            details: error.message || String(error)
          }, 500);
        }
      }
    };
  }
});

// src/controllers/tags/tags.controller.ts
var tags_controller_exports = {};
__export(tags_controller_exports, {
  TagsController: () => TagsController
});
import { BaseController as BaseController7 } from "@oxlayer/foundation-http-kit";
import { z as z9 } from "zod";
var createTagSchema, updateTagSchema, listTagsQuerySchema, TagsController;
var init_tags_controller = __esm({
  "src/controllers/tags/tags.controller.ts"() {
    "use strict";
    createTagSchema = z9.object({
      workspaceId: z9.string().uuid().describe("Workspace ID"),
      key: z9.string().min(1).max(100).describe("Tag key"),
      value: z9.string().min(1).max(255).describe("Tag value"),
      isPrimary: z9.boolean().optional().describe("Whether this is a primary tag"),
      description: z9.string().optional().describe("Tag description"),
      color: z9.string().regex(/^#[0-9A-F]{6}$/i).optional().describe("Tag color as hex")
    });
    updateTagSchema = z9.object({
      key: z9.string().min(1).max(255).optional().describe("Tag key"),
      value: z9.string().min(1).max(255).optional().describe("Tag value"),
      isPrimary: z9.boolean().optional().describe("Whether this is a primary tag"),
      description: z9.string().optional().describe("Tag description"),
      color: z9.string().regex(/^#[0-9A-F]{6}$/i).optional().describe("Tag color as hex")
    });
    listTagsQuerySchema = z9.object({
      workspaceId: z9.string().uuid().optional().describe("Filter by workspace ID"),
      key: z9.string().optional().describe("Filter by key"),
      value: z9.string().optional().describe("Filter by value"),
      isPrimary: z9.string().transform((v) => v === "true").optional().describe("Filter primary tags")
    });
    TagsController = class extends BaseController7 {
      constructor(createTagUseCase, getTagUseCase, listTagsUseCase, updateTagUseCase, deleteTagUseCase) {
        super();
        this.createTagUseCase = createTagUseCase;
        this.getTagUseCase = getTagUseCase;
        this.listTagsUseCase = listTagsUseCase;
        this.updateTagUseCase = updateTagUseCase;
        this.deleteTagUseCase = deleteTagUseCase;
      }
      /**
       * POST /api/tags - Create a new tag
       */
      async create(c) {
        try {
          const body = await c.req.json();
          const input = createTagSchema.safeParse(body);
          if (!input.success) {
            return this.validationError(input.error.flatten().fieldErrors);
          }
          const result = await this.createTagUseCase.execute(input.data);
          return this.created({
            message: "Tag created successfully",
            tagId: result.tagId
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/tags/:id - Get tag by ID
       */
      async getById(c) {
        try {
          const id = c.req.param("id");
          if (!id || !z9.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid tag ID");
          }
          const result = await this.getTagUseCase.execute({ id });
          return this.ok({
            message: "Tag retrieved successfully",
            ...result
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/tags - List tags
       */
      async list(c) {
        try {
          const query = listTagsQuerySchema.safeParse(c.req.query());
          if (!query.success) {
            return this.validationError(query.error.flatten().fieldErrors);
          }
          const result = await this.listTagsUseCase.execute({
            workspaceId: query.data.workspaceId,
            key: query.data.key,
            value: query.data.value,
            isPrimary: query.data.isPrimary
          });
          return c.json(result.tags);
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/tags/keys - Get unique tag keys
       */
      async getKeys(c) {
        try {
          const workspaceId = c.req.query("workspaceId");
          if (!workspaceId || !z9.string().uuid().safeParse(workspaceId).success) {
            return this.badRequest("Valid workspace ID is required");
          }
          const result = await this.listTagsUseCase.execute({ workspaceId });
          const keys = [...new Set(result.tags.map((t) => t.key))].sort();
          return c.json(keys);
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/tags/values/:key - Get unique values for a key
       */
      async getValuesByKey(c) {
        try {
          const key = c.req.param("key");
          const workspaceId = c.req.query("workspaceId");
          if (!key) {
            return this.badRequest("Key is required");
          }
          if (!workspaceId || !z9.string().uuid().safeParse(workspaceId).success) {
            return this.badRequest("Valid workspace ID is required");
          }
          const result = await this.listTagsUseCase.execute({ workspaceId, key });
          const values = [...new Set(result.tags.map((t) => t.value))].sort();
          return c.json(values);
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * PATCH /api/tags/:id - Update a tag
       */
      async update(c) {
        try {
          const id = c.req.param("id");
          const body = await c.req.json();
          const input = updateTagSchema.safeParse(body);
          if (!id || !z9.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid tag ID");
          }
          if (!input.success) {
            return this.validationError(input.error.flatten().fieldErrors);
          }
          const result = await this.updateTagUseCase.execute({
            id,
            ...input.data
          });
          return this.ok({
            message: "Tag updated successfully",
            ...result
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * DELETE /api/tags/:id - Delete a tag
       */
      async delete(c) {
        try {
          const id = c.req.param("id");
          if (!id || !z9.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid tag ID");
          }
          await this.deleteTagUseCase.execute({ id });
          return this.ok({
            message: "Tag deleted successfully"
          });
        } catch (error) {
          return this.error(error);
        }
      }
    };
  }
});

// src/controllers/templates/templates.controller.ts
var templates_controller_exports = {};
__export(templates_controller_exports, {
  TemplatesController: () => TemplatesController
});
import { BaseController as BaseController8 } from "@oxlayer/foundation-http-kit";
import { z as z10 } from "zod";
var createTemplateSchema, updateTemplateSchema, listTemplatesQuerySchema, TemplatesController;
var init_templates_controller = __esm({
  "src/controllers/templates/templates.controller.ts"() {
    "use strict";
    createTemplateSchema = z10.object({
      workspaceId: z10.string().uuid().describe("Workspace ID"),
      name: z10.string().min(1).max(255).describe("Template name"),
      type: z10.enum(["whatsapp", "email", "sms"]).describe("Template type"),
      subject: z10.string().optional().describe("Template subject (for email)"),
      body: z10.string().min(1).describe("Template body"),
      variables: z10.array(z10.string()).optional().describe("Template variables"),
      category: z10.string().optional().describe("Template category"),
      language: z10.string().optional().describe("Template language code"),
      isActive: z10.boolean().optional().describe("Whether template is active"),
      externalId: z10.string().optional().describe("External template ID"),
      status: z10.enum(["draft", "pending", "approved", "rejected"]).optional().describe("Template status")
    });
    updateTemplateSchema = z10.object({
      name: z10.string().min(1).max(255).optional().describe("Template name"),
      type: z10.enum(["whatsapp", "email", "sms"]).optional().describe("Template type"),
      subject: z10.string().optional().describe("Template subject (for email)"),
      body: z10.string().min(1).optional().describe("Template body"),
      variables: z10.array(z10.string()).optional().describe("Template variables"),
      category: z10.string().optional().describe("Template category"),
      language: z10.string().optional().describe("Template language code"),
      isActive: z10.boolean().optional().describe("Whether template is active"),
      externalId: z10.string().optional().describe("External template ID"),
      status: z10.enum(["draft", "pending", "approved", "rejected"]).optional().describe("Template status")
    });
    listTemplatesQuerySchema = z10.object({
      workspaceId: z10.string().uuid().optional().describe("Filter by workspace ID"),
      type: z10.enum(["whatsapp", "email", "sms"]).optional().describe("Filter by type"),
      category: z10.string().optional().describe("Filter by category"),
      status: z10.enum(["draft", "pending", "approved", "rejected"]).optional().describe("Filter by status"),
      isActive: z10.string().transform((v) => v === "true").optional().describe("Filter active templates")
    });
    TemplatesController = class extends BaseController8 {
      constructor(createTemplateUseCase, getTemplateUseCase, listTemplatesUseCase, updateTemplateUseCase, deleteTemplateUseCase) {
        super();
        this.createTemplateUseCase = createTemplateUseCase;
        this.getTemplateUseCase = getTemplateUseCase;
        this.listTemplatesUseCase = listTemplatesUseCase;
        this.updateTemplateUseCase = updateTemplateUseCase;
        this.deleteTemplateUseCase = deleteTemplateUseCase;
      }
      /**
       * POST /api/templates - Create a new template
       */
      async create(c) {
        try {
          const body = await c.req.json();
          const input = createTemplateSchema.safeParse(body);
          if (!input.success) {
            return this.validationError(input.error.flatten().fieldErrors);
          }
          const result = await this.createTemplateUseCase.execute(input.data);
          return this.created({
            message: "Template created successfully",
            templateId: result.templateId
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/templates/:id - Get template by ID
       */
      async getById(c) {
        try {
          const id = c.req.param("id");
          if (!id || !z10.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid template ID");
          }
          const result = await this.getTemplateUseCase.execute({ id });
          return this.ok({
            message: "Template retrieved successfully",
            ...result
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/templates - List templates
       */
      async list(c) {
        try {
          const query = listTemplatesQuerySchema.safeParse(c.req.query());
          if (!query.success) {
            return this.validationError(query.error.flatten().fieldErrors);
          }
          const result = await this.listTemplatesUseCase.execute({
            workspaceId: query.data.workspaceId,
            type: query.data.type,
            category: query.data.category,
            status: query.data.status,
            isActive: query.data.isActive
          });
          return c.json(result.templates);
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * PATCH /api/templates/:id - Update a template
       */
      async update(c) {
        try {
          const id = c.req.param("id");
          const body = await c.req.json();
          const input = updateTemplateSchema.safeParse(body);
          if (!id || !z10.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid template ID");
          }
          if (!input.success) {
            return this.validationError(input.error.flatten().fieldErrors);
          }
          const result = await this.updateTemplateUseCase.execute({
            id,
            ...input.data
          });
          return this.ok({
            message: "Template updated successfully",
            ...result
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * DELETE /api/templates/:id - Delete a template
       */
      async delete(c) {
        try {
          const id = c.req.param("id");
          if (!id || !z10.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid template ID");
          }
          await this.deleteTemplateUseCase.execute({ id });
          return this.ok({
            message: "Template deleted successfully"
          });
        } catch (error) {
          return this.error(error);
        }
      }
    };
  }
});

// src/controllers/campaigns/campaigns.controller.ts
var campaigns_controller_exports = {};
__export(campaigns_controller_exports, {
  CampaignsController: () => CampaignsController
});
import { BaseController as BaseController9 } from "@oxlayer/foundation-http-kit";
import { z as z11 } from "zod";
var createCampaignSchema, updateCampaignSchema, listCampaignsQuerySchema, CampaignsController;
var init_campaigns_controller = __esm({
  "src/controllers/campaigns/campaigns.controller.ts"() {
    "use strict";
    createCampaignSchema = z11.object({
      workspaceId: z11.string().uuid().describe("Workspace ID"),
      examId: z11.string().uuid().optional().describe("Exam ID"),
      templateId: z11.string().uuid().describe("Template ID"),
      name: z11.string().min(1).max(255).describe("Campaign name"),
      description: z11.string().optional().describe("Campaign description"),
      scheduledAt: z11.string().datetime().optional().describe("Schedule date/time"),
      tags: z11.array(z11.string()).optional().describe("Tag keys for filtering recipients")
    });
    updateCampaignSchema = z11.object({
      name: z11.string().min(1).max(255).optional().describe("Campaign name"),
      description: z11.string().optional().describe("Campaign description"),
      templateId: z11.string().uuid().optional().describe("Template ID"),
      scheduledAt: z11.string().datetime().optional().describe("Schedule date/time"),
      tags: z11.array(z11.string()).optional().describe("Tag keys for filtering recipients")
    });
    listCampaignsQuerySchema = z11.object({
      workspaceId: z11.string().uuid().optional().describe("Filter by workspace ID"),
      examId: z11.string().uuid().optional().describe("Filter by exam ID")
    });
    CampaignsController = class extends BaseController9 {
      constructor(createCampaignUseCase, getCampaignUseCase, listCampaignsUseCase, updateCampaignUseCase, deleteCampaignUseCase) {
        super();
        this.createCampaignUseCase = createCampaignUseCase;
        this.getCampaignUseCase = getCampaignUseCase;
        this.listCampaignsUseCase = listCampaignsUseCase;
        this.updateCampaignUseCase = updateCampaignUseCase;
        this.deleteCampaignUseCase = deleteCampaignUseCase;
      }
      /**
       * POST /api/campaigns - Create a new campaign
       */
      async create(c) {
        try {
          const body = await c.req.json();
          const input = createCampaignSchema.safeParse(body);
          if (!input.success) {
            return this.validationError(input.error.flatten().fieldErrors);
          }
          const result = await this.createCampaignUseCase.execute({
            ...input.data,
            scheduledAt: input.data.scheduledAt ? new Date(input.data.scheduledAt) : void 0
          });
          return this.created({
            message: "Campaign created successfully",
            campaignId: result.campaignId
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/campaigns/:id - Get campaign by ID
       */
      async getById(c) {
        try {
          const id = c.req.param("id");
          if (!id || !z11.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid campaign ID");
          }
          const result = await this.getCampaignUseCase.execute({ id });
          return this.ok({
            message: "Campaign retrieved successfully",
            ...result
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * GET /api/campaigns - List campaigns
       */
      async list(c) {
        try {
          const query = listCampaignsQuerySchema.safeParse(c.req.query());
          if (!query.success) {
            return this.validationError(query.error.flatten().fieldErrors);
          }
          const result = await this.listCampaignsUseCase.execute({
            workspaceId: query.data.workspaceId,
            examId: query.data.examId
          });
          return c.json(result.campaigns);
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * PATCH /api/campaigns/:id - Update a campaign
       */
      async update(c) {
        try {
          const id = c.req.param("id");
          const body = await c.req.json();
          const input = updateCampaignSchema.safeParse(body);
          if (!id || !z11.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid campaign ID");
          }
          if (!input.success) {
            return this.validationError(input.error.flatten().fieldErrors);
          }
          const result = await this.updateCampaignUseCase.execute({
            id,
            ...input.data,
            scheduledAt: input.data.scheduledAt ? new Date(input.data.scheduledAt) : void 0
          });
          return this.ok({
            message: "Campaign updated successfully",
            ...result
          });
        } catch (error) {
          return this.error(error);
        }
      }
      /**
       * DELETE /api/campaigns/:id - Delete a campaign
       */
      async delete(c) {
        try {
          const id = c.req.param("id");
          if (!id || !z11.string().uuid().safeParse(id).success) {
            return this.badRequest("Invalid campaign ID");
          }
          await this.deleteCampaignUseCase.execute({ id });
          return this.ok({
            message: "Campaign deleted successfully"
          });
        } catch (error) {
          return this.error(error);
        }
      }
    };
  }
});

// src/server.ts
import "dotenv/config";

// src/db/init.ts
init_app_config();
import postgres from "postgres";
async function initDatabase() {
  const sql4 = postgres({
    host: ENV.POSTGRES_HOST,
    port: ENV.POSTGRES_PORT,
    database: "postgres",
    // Connect to default database
    username: ENV.POSTGRES_USER,
    password: ENV.POSTGRES_PASSWORD
  });
  try {
    console.log(`\u{1F50D} Checking if database '${ENV.POSTGRES_DATABASE}' exists...`);
    const result = await sql4`
      SELECT 1 FROM pg_database WHERE datname = ${ENV.POSTGRES_DATABASE}
    `;
    if (result.length === 0) {
      console.log(`\u2795 Creating database '${ENV.POSTGRES_DATABASE}'...`);
      await sql4.unsafe(`CREATE DATABASE ${ENV.POSTGRES_DATABASE}`);
      console.log(`\u2705 Database '${ENV.POSTGRES_DATABASE}' created successfully!`);
    } else {
      console.log(`\u2705 Database '${ENV.POSTGRES_DATABASE}' already exists.`);
    }
  } catch (error) {
    console.error(`\u274C Failed to initialize database:`, error);
    throw error;
  } finally {
    await sql4.end();
  }
}
if (import.meta.main) {
  await initDatabase().then(() => {
    console.log("\u2705 Database initialization complete.");
    process.exit(0);
  }).catch((error) => {
    console.error("\u274C Database initialization failed:", error);
    process.exit(1);
  });
}

// src/app.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// src/config/postgres.config.ts
init_app_config();
init_schema();
import { createPostgres } from "@oxlayer/capabilities-adapters-postgres";
function createPostgresConnection() {
  return createPostgres({
    host: ENV.POSTGRES_HOST,
    port: ENV.POSTGRES_PORT,
    database: ENV.POSTGRES_DATABASE,
    user: ENV.POSTGRES_USER,
    password: ENV.POSTGRES_PASSWORD,
    max: 20,
    idle_timeout: 30,
    connect_timeout: 10,
    migrationSQL: createTableSQLString
  });
}

// src/config/redis.config.ts
init_app_config();
import { createRedisClient, createRedisCacheStore } from "@oxlayer/capabilities-adapters-redis";
import { createCache, createCachedRepository } from "@oxlayer/capabilities-cache";
function createRedisConnection() {
  return createRedisClient({
    host: ENV.REDIS_HOST,
    port: ENV.REDIS_PORT,
    password: ENV.REDIS_PASSWORD,
    db: ENV.REDIS_DB,
    // Connection pool settings
    maxRetriesPerRequest: 3,
    enableReadyCheck: true
  });
}

// src/config/rabbitmq.config.ts
init_app_config();
import { createRabbitMQEventBus } from "@oxlayer/capabilities-adapters-rabbitmq";
function createEventBus() {
  const rabbitmqUrl = `amqp://${ENV.RABBITMQ_USERNAME}:${ENV.RABBITMQ_PASSWORD}@${ENV.RABBITMQ_HOST}:${ENV.RABBITMQ_PORT}${ENV.RABBITMQ_VHOST}`;
  const eventBus = createRabbitMQEventBus(
    {
      url: rabbitmqUrl,
      exchange: "globex.events",
      exchangeType: "topic",
      queue: ENV.RABBITMQ_QUEUE,
      routingKey: "globex.*",
      durable: true,
      autoDelete: false,
      heartbeat: 10
    },
    {
      serviceName: "globex-api",
      serviceVersion: "1.0.0",
      tracer: null
      // TODO: Add OpenTelemetry tracing support
    }
  );
  return eventBus;
}
async function setupEventHandlers(eventBus) {
  await eventBus.start();
  await eventBus.on("Exam.Created", async (event) => {
    console.log("\u{1F4DD} Exam Created:", event);
  });
  await eventBus.on("Exam.Updated", async (event) => {
    console.log("\u270F\uFE0F Exam Updated:", event);
  });
  await eventBus.on("Exam.Deleted", async (event) => {
    console.log("\u{1F5D1}\uFE0F Exam Deleted:", event);
  });
  await eventBus.on("Exam.Assigned", async (event) => {
    console.log("\u{1F4CB} Exam Assigned:", event);
  });
  await eventBus.on("Evaluation.Started", async (event) => {
    console.log("\u{1F504} Evaluation Started:", event);
  });
  await eventBus.on("Evaluation.Completed", async (event) => {
    console.log("\u2705 Evaluation Completed:", event);
  });
  await eventBus.on("Evaluation.Failed", async (event) => {
    console.log("\u274C Evaluation Failed:", event);
  });
  await eventBus.on("Evaluation.AnalysisCompleted", async (event) => {
    console.log("\u{1F50D} Evaluation Analysis Completed:", event);
  });
  await eventBus.on("Candidate.Created", async (event) => {
    console.log("\u{1F464} Candidate Created:", event);
  });
  await eventBus.on("Candidate.Updated", async (event) => {
    console.log("\u{1F464} Candidate Updated:", event);
  });
  await eventBus.on("Workflow.Started", async (event) => {
    console.log("\u2699\uFE0F Workflow Started:", event);
  });
  await eventBus.on("Workflow.Completed", async (event) => {
    console.log("\u2699\uFE0F Workflow Completed:", event);
  });
  await eventBus.on("Workflow.Failed", async (event) => {
    console.log("\u2699\uFE0F Workflow Failed:", event);
  });
  await eventBus.on("BulkEvaluation.Completed", async (event) => {
    console.log("\u{1F4CA} Bulk Evaluation Completed:", event);
  });
  console.log("\u2705 All event handlers registered");
  return eventBus;
}

// src/config/tenancy.config.ts
init_app_config();
function createInMemoryTenantResolver() {
  const tenants = /* @__PURE__ */ new Map([
    [
      "default",
      {
        id: "default",
        state: "ready",
        tier: "b2b",
        region: "us-east-1",
        isolation: {
          database: "shared",
          cache: "shared",
          storage: "shared"
        },
        database: {
          host: ENV.POSTGRES_HOST,
          port: ENV.POSTGRES_PORT,
          name: ENV.POSTGRES_DATABASE,
          user: ENV.POSTGRES_USER
        },
        cache: {
          host: ENV.REDIS_HOST,
          port: ENV.REDIS_PORT,
          db: ENV.REDIS_DB
        }
      }
    ]
  ]);
  return {
    async resolve(tenantId) {
      const tenant = tenants.get(tenantId);
      if (!tenant) {
        throw new Error(`Tenant not found: ${tenantId}`);
      }
      return tenant;
    },
    async invalidate(tenantId) {
    },
    async list() {
      return Array.from(tenants.values());
    }
  };
}

// src/infrastructure/container.ts
import { sql as sql3 } from "drizzle-orm";
var DIContainer = class _DIContainer {
  static instance;
  // Infrastructure
  pg;
  redis;
  eventBus;
  tenantResolver;
  // Repositories (lazy loaded)
  _examRepository;
  _questionRepository;
  _candidateRepository;
  _examAssignmentRepository;
  _answerRepository;
  _evaluationResultRepository;
  _workspaceRepository;
  _tagRepository;
  _templateRepository;
  _whatsappCampaignRepository;
  // Use cases (lazy loaded)
  _createExamUseCase;
  _getExamUseCase;
  _listExamsUseCase;
  _updateExamUseCase;
  _deleteExamUseCase;
  _assignExamUseCase;
  _bulkEvaluateUseCase;
  _getEvaluationUseCase;
  _listEvaluationResultsUseCase;
  _createWorkspaceUseCase;
  _getWorkspaceUseCase;
  _listWorkspacesUseCase;
  _updateWorkspaceUseCase;
  _deleteWorkspaceUseCase;
  _createQuestionUseCase;
  _getQuestionUseCase;
  _listQuestionsUseCase;
  _updateQuestionUseCase;
  _deleteQuestionUseCase;
  _createAnswerUseCase;
  _getAnswerUseCase;
  _listAnswersUseCase;
  _updateAnswerUseCase;
  _deleteAnswerUseCase;
  _createCandidateUseCase;
  _getCandidateUseCase;
  _listCandidatesUseCase;
  _updateCandidateUseCase;
  _deleteCandidateUseCase;
  _createTagUseCase;
  _getTagUseCase;
  _listTagsUseCase;
  _updateTagUseCase;
  _deleteTagUseCase;
  _createTemplateUseCase;
  _getTemplateUseCase;
  _listTemplatesUseCase;
  _updateTemplateUseCase;
  _deleteTemplateUseCase;
  _createCampaignUseCase;
  _getCampaignUseCase;
  _listCampaignsUseCase;
  _updateCampaignUseCase;
  _deleteCampaignUseCase;
  constructor() {
    this.pg = createPostgresConnection();
    this.redis = createRedisConnection();
    this.tenantResolver = createInMemoryTenantResolver();
  }
  static getInstance() {
    if (!_DIContainer.instance) {
      _DIContainer.instance = new _DIContainer();
    }
    return _DIContainer.instance;
  }
  /**
   * Initialize all async resources
   */
  async initialize() {
    console.log("\u{1F527} Initializing infrastructure...");
    this.eventBus = createEventBus();
    await setupEventHandlers(this.eventBus);
    console.log("\u2705 Event bus connected");
    await this.pg.db.execute(sql3`SELECT 1`);
    console.log("\u2705 Database connected");
    await this.redis.set("health", "ok");
    await this.redis.del("health");
    console.log("\u2705 Redis connected");
    console.log("");
  }
  // =========================================================================
  // REPOSITORIES
  // =========================================================================
  /**
   * Get exam repository
   */
  get examRepository() {
    if (!this._examRepository) {
      const { PostgresExamRepository: PostgresExamRepository2 } = (init_postgres_exam_repository(), __toCommonJS(postgres_exam_repository_exports));
      this._examRepository = new PostgresExamRepository2(this.pg.db);
    }
    return this._examRepository;
  }
  /**
   * Get question repository
   */
  get questionRepository() {
    if (!this._questionRepository) {
      const { PostgresQuestionRepository: PostgresQuestionRepository2 } = (init_postgres_question_repository(), __toCommonJS(postgres_question_repository_exports));
      this._questionRepository = new PostgresQuestionRepository2(this.pg.db);
    }
    return this._questionRepository;
  }
  /**
   * Get candidate repository
   */
  get candidateRepository() {
    if (!this._candidateRepository) {
      const { PostgresCandidateRepository: PostgresCandidateRepository2 } = (init_postgres_candidate_repository(), __toCommonJS(postgres_candidate_repository_exports));
      this._candidateRepository = new PostgresCandidateRepository2(this.pg.db);
    }
    return this._candidateRepository;
  }
  /**
   * Get exam assignment repository
   */
  get examAssignmentRepository() {
    if (!this._examAssignmentRepository) {
      const { PostgresExamAssignmentRepository: PostgresExamAssignmentRepository2 } = (init_postgres_exam_assignment_repository(), __toCommonJS(postgres_exam_assignment_repository_exports));
      this._examAssignmentRepository = new PostgresExamAssignmentRepository2(this.pg.db);
    }
    return this._examAssignmentRepository;
  }
  /**
   * Get answer repository
   */
  get answerRepository() {
    if (!this._answerRepository) {
      const { PostgresAnswerRepository: PostgresAnswerRepository2 } = (init_postgres_answer_repository(), __toCommonJS(postgres_answer_repository_exports));
      this._answerRepository = new PostgresAnswerRepository2(this.pg.db);
    }
    return this._answerRepository;
  }
  /**
   * Get evaluation result repository
   */
  get evaluationResultRepository() {
    if (!this._evaluationResultRepository) {
      const { PostgresEvaluationResultRepository: PostgresEvaluationResultRepository2 } = (init_postgres_evaluation_result_repository(), __toCommonJS(postgres_evaluation_result_repository_exports));
      this._evaluationResultRepository = new PostgresEvaluationResultRepository2(this.pg.db);
    }
    return this._evaluationResultRepository;
  }
  /**
   * Get workspace repository
   */
  get workspaceRepository() {
    if (!this._workspaceRepository) {
      const { PostgresWorkspaceRepository: PostgresWorkspaceRepository2 } = (init_postgres_workspace_repository(), __toCommonJS(postgres_workspace_repository_exports));
      this._workspaceRepository = new PostgresWorkspaceRepository2(this.pg.db);
    }
    return this._workspaceRepository;
  }
  /**
   * Get tag repository
   */
  get tagRepository() {
    if (!this._tagRepository) {
      const { PostgresTagRepository: PostgresTagRepository2 } = (init_postgres_tag_repository(), __toCommonJS(postgres_tag_repository_exports));
      this._tagRepository = new PostgresTagRepository2(this.pg.db);
    }
    return this._tagRepository;
  }
  /**
   * Get template repository
   */
  get templateRepository() {
    if (!this._templateRepository) {
      const { PostgresTemplateRepository: PostgresTemplateRepository2 } = (init_postgres_template_repository(), __toCommonJS(postgres_template_repository_exports));
      this._templateRepository = new PostgresTemplateRepository2(this.pg.db);
    }
    return this._templateRepository;
  }
  /**
   * Get WhatsApp campaign repository
   */
  get whatsappCampaignRepository() {
    if (!this._whatsappCampaignRepository) {
      const { PostgresWhatsAppCampaignRepository: PostgresWhatsAppCampaignRepository2 } = (init_postgres_whatsapp_campaign_repository(), __toCommonJS(postgres_whatsapp_campaign_repository_exports));
      this._whatsappCampaignRepository = new PostgresWhatsAppCampaignRepository2(this.pg.db);
    }
    return this._whatsappCampaignRepository;
  }
  // =========================================================================
  // USE CASES
  // =========================================================================
  /**
   * Get create exam use case
   */
  get createExamUseCase() {
    if (!this._createExamUseCase) {
      const { CreateExamUseCase: CreateExamUseCase2 } = (init_create_exam_use_case(), __toCommonJS(create_exam_use_case_exports));
      this._createExamUseCase = new CreateExamUseCase2(
        this.examRepository,
        this.questionRepository,
        this.eventBus
      );
    }
    return this._createExamUseCase;
  }
  /**
   * Get get exam use case
   */
  get getExamUseCase() {
    if (!this._getExamUseCase) {
      const { GetExamUseCase: GetExamUseCase2 } = (init_get_exam_use_case(), __toCommonJS(get_exam_use_case_exports));
      this._getExamUseCase = new GetExamUseCase2(
        this.examRepository,
        this.questionRepository
      );
    }
    return this._getExamUseCase;
  }
  /**
   * Get delete exam use case
   */
  get deleteExamUseCase() {
    if (!this._deleteExamUseCase) {
      const { DeleteExamUseCase: DeleteExamUseCase2 } = (init_delete_exam_use_case(), __toCommonJS(delete_exam_use_case_exports));
      this._deleteExamUseCase = new DeleteExamUseCase2(
        this.examRepository,
        this.questionRepository,
        this.eventBus
      );
    }
    return this._deleteExamUseCase;
  }
  /**
   * Get list exams use case
   */
  get listExamsUseCase() {
    if (!this._listExamsUseCase) {
      const { ListExamsUseCase: ListExamsUseCase2 } = (init_list_exams_use_case(), __toCommonJS(list_exams_use_case_exports));
      this._listExamsUseCase = new ListExamsUseCase2(
        this.examRepository
      );
    }
    return this._listExamsUseCase;
  }
  /**
   * Get update exam use case
   */
  get updateExamUseCase() {
    if (!this._updateExamUseCase) {
      const { UpdateExamUseCase: UpdateExamUseCase2 } = (init_update_exam_use_case(), __toCommonJS(update_exam_use_case_exports));
      this._updateExamUseCase = new UpdateExamUseCase2(
        this.examRepository
      );
    }
    return this._updateExamUseCase;
  }
  /**
   * Get assign exam use case
   */
  get assignExamUseCase() {
    if (!this._assignExamUseCase) {
      const { AssignExamUseCase: AssignExamUseCase2 } = (init_assign_exam_use_case(), __toCommonJS(assign_exam_use_case_exports));
      this._assignExamUseCase = new AssignExamUseCase2(
        this.examAssignmentRepository,
        this.candidateRepository,
        this.eventBus
      );
    }
    return this._assignExamUseCase;
  }
  /**
   * Get bulk evaluate use case
   */
  get bulkEvaluateUseCase() {
    if (!this._bulkEvaluateUseCase) {
      const { BulkEvaluateUseCase: BulkEvaluateUseCase2 } = (init_bulk_evaluate_use_case(), __toCommonJS(bulk_evaluate_use_case_exports));
      this._bulkEvaluateUseCase = new BulkEvaluateUseCase2(
        this.candidateRepository,
        this.examAssignmentRepository,
        this.answerRepository,
        this.evaluationResultRepository,
        this.eventBus
      );
    }
    return this._bulkEvaluateUseCase;
  }
  /**
   * Get get evaluation use case
   */
  get getEvaluationUseCase() {
    if (!this._getEvaluationUseCase) {
      const { GetEvaluationUseCase: GetEvaluationUseCase2 } = (init_get_evaluation_use_case(), __toCommonJS(get_evaluation_use_case_exports));
      this._getEvaluationUseCase = new GetEvaluationUseCase2(
        this.evaluationResultRepository
      );
    }
    return this._getEvaluationUseCase;
  }
  /**
   * Get list evaluation results use case
   */
  get listEvaluationResultsUseCase() {
    if (!this._listEvaluationResultsUseCase) {
      const { ListEvaluationResultsUseCase: ListEvaluationResultsUseCase2 } = (init_list_evaluation_results_use_case(), __toCommonJS(list_evaluation_results_use_case_exports));
      this._listEvaluationResultsUseCase = new ListEvaluationResultsUseCase2(
        this.evaluationResultRepository
      );
    }
    return this._listEvaluationResultsUseCase;
  }
  /**
   * Get create workspace use case
   */
  get createWorkspaceUseCase() {
    if (!this._createWorkspaceUseCase) {
      const { CreateWorkspaceUseCase: CreateWorkspaceUseCase2 } = (init_create_workspace_use_case(), __toCommonJS(create_workspace_use_case_exports));
      this._createWorkspaceUseCase = new CreateWorkspaceUseCase2(
        this.workspaceRepository
      );
    }
    return this._createWorkspaceUseCase;
  }
  /**
   * Get get workspace use case
   */
  get getWorkspaceUseCase() {
    if (!this._getWorkspaceUseCase) {
      const { GetWorkspaceUseCase: GetWorkspaceUseCase2 } = (init_get_workspace_use_case(), __toCommonJS(get_workspace_use_case_exports));
      this._getWorkspaceUseCase = new GetWorkspaceUseCase2(
        this.workspaceRepository
      );
    }
    return this._getWorkspaceUseCase;
  }
  /**
   * Get list workspaces use case
   */
  get listWorkspacesUseCase() {
    if (!this._listWorkspacesUseCase) {
      const { ListWorkspacesUseCase: ListWorkspacesUseCase2 } = (init_list_workspaces_use_case(), __toCommonJS(list_workspaces_use_case_exports));
      this._listWorkspacesUseCase = new ListWorkspacesUseCase2(
        this.workspaceRepository
      );
    }
    return this._listWorkspacesUseCase;
  }
  /**
   * Get update workspace use case
   */
  get updateWorkspaceUseCase() {
    if (!this._updateWorkspaceUseCase) {
      const { UpdateWorkspaceUseCase: UpdateWorkspaceUseCase2 } = (init_update_workspace_use_case(), __toCommonJS(update_workspace_use_case_exports));
      this._updateWorkspaceUseCase = new UpdateWorkspaceUseCase2(
        this.workspaceRepository
      );
    }
    return this._updateWorkspaceUseCase;
  }
  /**
   * Get delete workspace use case
   */
  get deleteWorkspaceUseCase() {
    if (!this._deleteWorkspaceUseCase) {
      const { DeleteWorkspaceUseCase: DeleteWorkspaceUseCase2 } = (init_delete_workspace_use_case(), __toCommonJS(delete_workspace_use_case_exports));
      this._deleteWorkspaceUseCase = new DeleteWorkspaceUseCase2(
        this.workspaceRepository
      );
    }
    return this._deleteWorkspaceUseCase;
  }
  /**
   * Get create question use case
   */
  get createQuestionUseCase() {
    if (!this._createQuestionUseCase) {
      const { CreateQuestionUseCase: CreateQuestionUseCase2 } = (init_create_question_use_case(), __toCommonJS(create_question_use_case_exports));
      this._createQuestionUseCase = new CreateQuestionUseCase2(
        this.questionRepository
      );
    }
    return this._createQuestionUseCase;
  }
  /**
   * Get get question use case
   */
  get getQuestionUseCase() {
    if (!this._getQuestionUseCase) {
      const { GetQuestionUseCase: GetQuestionUseCase2 } = (init_get_question_use_case(), __toCommonJS(get_question_use_case_exports));
      this._getQuestionUseCase = new GetQuestionUseCase2(
        this.questionRepository
      );
    }
    return this._getQuestionUseCase;
  }
  /**
   * Get list questions use case
   */
  get listQuestionsUseCase() {
    if (!this._listQuestionsUseCase) {
      const { ListQuestionsUseCase: ListQuestionsUseCase2 } = (init_list_questions_use_case(), __toCommonJS(list_questions_use_case_exports));
      this._listQuestionsUseCase = new ListQuestionsUseCase2(
        this.questionRepository
      );
    }
    return this._listQuestionsUseCase;
  }
  /**
   * Get update question use case
   */
  get updateQuestionUseCase() {
    if (!this._updateQuestionUseCase) {
      const { UpdateQuestionUseCase: UpdateQuestionUseCase2 } = (init_update_question_use_case(), __toCommonJS(update_question_use_case_exports));
      this._updateQuestionUseCase = new UpdateQuestionUseCase2(
        this.questionRepository
      );
    }
    return this._updateQuestionUseCase;
  }
  /**
   * Get delete question use case
   */
  get deleteQuestionUseCase() {
    if (!this._deleteQuestionUseCase) {
      const { DeleteQuestionUseCase: DeleteQuestionUseCase2 } = (init_delete_question_use_case(), __toCommonJS(delete_question_use_case_exports));
      this._deleteQuestionUseCase = new DeleteQuestionUseCase2(
        this.questionRepository
      );
    }
    return this._deleteQuestionUseCase;
  }
  /**
   * Get create answer use case
   */
  get createAnswerUseCase() {
    if (!this._createAnswerUseCase) {
      const { CreateAnswerUseCase: CreateAnswerUseCase2 } = (init_create_answer_use_case(), __toCommonJS(create_answer_use_case_exports));
      this._createAnswerUseCase = new CreateAnswerUseCase2(
        this.answerRepository
      );
    }
    return this._createAnswerUseCase;
  }
  /**
   * Get get answer use case
   */
  get getAnswerUseCase() {
    if (!this._getAnswerUseCase) {
      const { GetAnswerUseCase: GetAnswerUseCase2 } = (init_get_answer_use_case(), __toCommonJS(get_answer_use_case_exports));
      this._getAnswerUseCase = new GetAnswerUseCase2(
        this.answerRepository
      );
    }
    return this._getAnswerUseCase;
  }
  /**
   * Get list answers use case
   */
  get listAnswersUseCase() {
    if (!this._listAnswersUseCase) {
      const { ListAnswersUseCase: ListAnswersUseCase2 } = (init_list_answers_use_case(), __toCommonJS(list_answers_use_case_exports));
      this._listAnswersUseCase = new ListAnswersUseCase2(
        this.answerRepository
      );
    }
    return this._listAnswersUseCase;
  }
  /**
   * Get update answer use case
   */
  get updateAnswerUseCase() {
    if (!this._updateAnswerUseCase) {
      const { UpdateAnswerUseCase: UpdateAnswerUseCase2 } = (init_update_answer_use_case(), __toCommonJS(update_answer_use_case_exports));
      this._updateAnswerUseCase = new UpdateAnswerUseCase2(
        this.answerRepository
      );
    }
    return this._updateAnswerUseCase;
  }
  /**
   * Get delete answer use case
   */
  get deleteAnswerUseCase() {
    if (!this._deleteAnswerUseCase) {
      const { DeleteAnswerUseCase: DeleteAnswerUseCase2 } = (init_delete_answer_use_case(), __toCommonJS(delete_answer_use_case_exports));
      this._deleteAnswerUseCase = new DeleteAnswerUseCase2(
        this.answerRepository
      );
    }
    return this._deleteAnswerUseCase;
  }
  /**
   * Get create candidate use case
   */
  get createCandidateUseCase() {
    if (!this._createCandidateUseCase) {
      const { CreateCandidateUseCase: CreateCandidateUseCase2 } = (init_create_candidate_use_case(), __toCommonJS(create_candidate_use_case_exports));
      this._createCandidateUseCase = new CreateCandidateUseCase2(
        this.candidateRepository,
        this.eventBus
      );
    }
    return this._createCandidateUseCase;
  }
  /**
   * Get get candidate use case
   */
  get getCandidateUseCase() {
    if (!this._getCandidateUseCase) {
      const { GetCandidateUseCase: GetCandidateUseCase2 } = (init_get_candidate_use_case(), __toCommonJS(get_candidate_use_case_exports));
      this._getCandidateUseCase = new GetCandidateUseCase2(
        this.candidateRepository
      );
    }
    return this._getCandidateUseCase;
  }
  /**
   * Get list candidates use case
   */
  get listCandidatesUseCase() {
    if (!this._listCandidatesUseCase) {
      const { ListCandidatesUseCase: ListCandidatesUseCase2 } = (init_list_candidates_use_case(), __toCommonJS(list_candidates_use_case_exports));
      this._listCandidatesUseCase = new ListCandidatesUseCase2(
        this.candidateRepository
      );
    }
    return this._listCandidatesUseCase;
  }
  /**
   * Get update candidate use case
   */
  get updateCandidateUseCase() {
    if (!this._updateCandidateUseCase) {
      const { UpdateCandidateUseCase: UpdateCandidateUseCase2 } = (init_update_candidate_use_case(), __toCommonJS(update_candidate_use_case_exports));
      this._updateCandidateUseCase = new UpdateCandidateUseCase2(
        this.candidateRepository,
        this.eventBus
      );
    }
    return this._updateCandidateUseCase;
  }
  /**
   * Get delete candidate use case
   */
  get deleteCandidateUseCase() {
    if (!this._deleteCandidateUseCase) {
      const { DeleteCandidateUseCase: DeleteCandidateUseCase2 } = (init_delete_candidate_use_case(), __toCommonJS(delete_candidate_use_case_exports));
      this._deleteCandidateUseCase = new DeleteCandidateUseCase2(
        this.candidateRepository,
        this.eventBus
      );
    }
    return this._deleteCandidateUseCase;
  }
  /**
   * Get create tag use case
   */
  get createTagUseCase() {
    if (!this._createTagUseCase) {
      const { CreateTagUseCase: CreateTagUseCase2 } = (init_create_tag_use_case(), __toCommonJS(create_tag_use_case_exports));
      this._createTagUseCase = new CreateTagUseCase2(
        this.tagRepository,
        this.eventBus
      );
    }
    return this._createTagUseCase;
  }
  /**
   * Get get tag use case
   */
  get getTagUseCase() {
    if (!this._getTagUseCase) {
      const { GetTagUseCase: GetTagUseCase2 } = (init_get_tag_use_case(), __toCommonJS(get_tag_use_case_exports));
      this._getTagUseCase = new GetTagUseCase2(
        this.tagRepository
      );
    }
    return this._getTagUseCase;
  }
  /**
   * Get list tags use case
   */
  get listTagsUseCase() {
    if (!this._listTagsUseCase) {
      const { ListTagsUseCase: ListTagsUseCase2 } = (init_list_tags_use_case(), __toCommonJS(list_tags_use_case_exports));
      this._listTagsUseCase = new ListTagsUseCase2(
        this.tagRepository
      );
    }
    return this._listTagsUseCase;
  }
  /**
   * Get update tag use case
   */
  get updateTagUseCase() {
    if (!this._updateTagUseCase) {
      const { UpdateTagUseCase: UpdateTagUseCase2 } = (init_update_tag_use_case(), __toCommonJS(update_tag_use_case_exports));
      this._updateTagUseCase = new UpdateTagUseCase2(
        this.tagRepository,
        this.eventBus
      );
    }
    return this._updateTagUseCase;
  }
  /**
   * Get delete tag use case
   */
  get deleteTagUseCase() {
    if (!this._deleteTagUseCase) {
      const { DeleteTagUseCase: DeleteTagUseCase2 } = (init_delete_tag_use_case(), __toCommonJS(delete_tag_use_case_exports));
      this._deleteTagUseCase = new DeleteTagUseCase2(
        this.tagRepository,
        this.eventBus
      );
    }
    return this._deleteTagUseCase;
  }
  /**
   * Get create template use case
   */
  get createTemplateUseCase() {
    if (!this._createTemplateUseCase) {
      const { CreateTemplateUseCase: CreateTemplateUseCase2 } = (init_create_template_use_case(), __toCommonJS(create_template_use_case_exports));
      this._createTemplateUseCase = new CreateTemplateUseCase2(
        this.templateRepository,
        this.eventBus
      );
    }
    return this._createTemplateUseCase;
  }
  /**
   * Get get template use case
   */
  get getTemplateUseCase() {
    if (!this._getTemplateUseCase) {
      const { GetTemplateUseCase: GetTemplateUseCase2 } = (init_get_template_use_case(), __toCommonJS(get_template_use_case_exports));
      this._getTemplateUseCase = new GetTemplateUseCase2(
        this.templateRepository
      );
    }
    return this._getTemplateUseCase;
  }
  /**
   * Get list templates use case
   */
  get listTemplatesUseCase() {
    if (!this._listTemplatesUseCase) {
      const { ListTemplatesUseCase: ListTemplatesUseCase2 } = (init_list_templates_use_case(), __toCommonJS(list_templates_use_case_exports));
      this._listTemplatesUseCase = new ListTemplatesUseCase2(
        this.templateRepository
      );
    }
    return this._listTemplatesUseCase;
  }
  /**
   * Get update template use case
   */
  get updateTemplateUseCase() {
    if (!this._updateTemplateUseCase) {
      const { UpdateTemplateUseCase: UpdateTemplateUseCase2 } = (init_update_template_use_case(), __toCommonJS(update_template_use_case_exports));
      this._updateTemplateUseCase = new UpdateTemplateUseCase2(
        this.templateRepository,
        this.eventBus
      );
    }
    return this._updateTemplateUseCase;
  }
  /**
   * Get delete template use case
   */
  get deleteTemplateUseCase() {
    if (!this._deleteTemplateUseCase) {
      const { DeleteTemplateUseCase: DeleteTemplateUseCase2 } = (init_delete_template_use_case(), __toCommonJS(delete_template_use_case_exports));
      this._deleteTemplateUseCase = new DeleteTemplateUseCase2(
        this.templateRepository,
        this.eventBus
      );
    }
    return this._deleteTemplateUseCase;
  }
  /**
   * Get create campaign use case
   */
  get createCampaignUseCase() {
    if (!this._createCampaignUseCase) {
      const { CreateWhatsAppCampaignUseCase: CreateWhatsAppCampaignUseCase2 } = (init_create_whatsapp_campaign_use_case(), __toCommonJS(create_whatsapp_campaign_use_case_exports));
      this._createCampaignUseCase = new CreateWhatsAppCampaignUseCase2(
        this.whatsappCampaignRepository,
        this.templateRepository,
        this.eventBus
      );
    }
    return this._createCampaignUseCase;
  }
  /**
   * Get get campaign use case
   */
  get getCampaignUseCase() {
    if (!this._getCampaignUseCase) {
      const { GetWhatsAppCampaignUseCase: GetWhatsAppCampaignUseCase2 } = (init_get_whatsapp_campaign_use_case(), __toCommonJS(get_whatsapp_campaign_use_case_exports));
      this._getCampaignUseCase = new GetWhatsAppCampaignUseCase2(
        this.whatsappCampaignRepository
      );
    }
    return this._getCampaignUseCase;
  }
  /**
   * Get list campaigns use case
   */
  get listCampaignsUseCase() {
    if (!this._listCampaignsUseCase) {
      const { ListWhatsAppCampaignsUseCase: ListWhatsAppCampaignsUseCase2 } = (init_list_whatsapp_campaigns_use_case(), __toCommonJS(list_whatsapp_campaigns_use_case_exports));
      this._listCampaignsUseCase = new ListWhatsAppCampaignsUseCase2(
        this.whatsappCampaignRepository
      );
    }
    return this._listCampaignsUseCase;
  }
  /**
   * Get update campaign use case
   */
  get updateCampaignUseCase() {
    if (!this._updateCampaignUseCase) {
      const { UpdateWhatsAppCampaignUseCase: UpdateWhatsAppCampaignUseCase2 } = (init_update_whatsapp_campaign_use_case(), __toCommonJS(update_whatsapp_campaign_use_case_exports));
      this._updateCampaignUseCase = new UpdateWhatsAppCampaignUseCase2(
        this.whatsappCampaignRepository,
        this.templateRepository,
        this.eventBus
      );
    }
    return this._updateCampaignUseCase;
  }
  /**
   * Get delete campaign use case
   */
  get deleteCampaignUseCase() {
    if (!this._deleteCampaignUseCase) {
      const { DeleteWhatsAppCampaignUseCase: DeleteWhatsAppCampaignUseCase2 } = (init_delete_whatsapp_campaign_use_case(), __toCommonJS(delete_whatsapp_campaign_use_case_exports));
      this._deleteCampaignUseCase = new DeleteWhatsAppCampaignUseCase2(
        this.whatsappCampaignRepository,
        this.eventBus
      );
    }
    return this._deleteCampaignUseCase;
  }
  // =========================================================================
  // CONTROLLERS
  // =========================================================================
  /**
   * Create exams controller
   */
  createExamsController() {
    const { ExamsController: ExamsController2 } = (init_exams_controller(), __toCommonJS(exams_controller_exports));
    return new ExamsController2(
      this.createExamUseCase,
      this.getExamUseCase,
      this.listExamsUseCase,
      this.deleteExamUseCase,
      this.updateExamUseCase
    );
  }
  /**
   * Create evaluations controller
   */
  createEvaluationsController() {
    const { EvaluationsController: EvaluationsController2 } = (init_evaluations_controller(), __toCommonJS(evaluations_controller_exports));
    return new EvaluationsController2(
      this.assignExamUseCase,
      this.bulkEvaluateUseCase,
      this.getEvaluationUseCase,
      this.listEvaluationResultsUseCase
    );
  }
  /**
   * Create workspaces controller
   */
  createWorkspacesController() {
    const { WorkspacesController: WorkspacesController2 } = (init_workspaces_controller(), __toCommonJS(workspaces_controller_exports));
    return new WorkspacesController2(
      this.createWorkspaceUseCase,
      this.getWorkspaceUseCase,
      this.listWorkspacesUseCase,
      this.updateWorkspaceUseCase,
      this.deleteWorkspaceUseCase
    );
  }
  /**
   * Create questions controller
   */
  createQuestionsController() {
    const { QuestionsController: QuestionsController2 } = (init_questions_controller(), __toCommonJS(questions_controller_exports));
    return new QuestionsController2(
      this.createQuestionUseCase,
      this.getQuestionUseCase,
      this.listQuestionsUseCase,
      this.updateQuestionUseCase,
      this.deleteQuestionUseCase
    );
  }
  /**
   * Create answers controller
   */
  createAnswersController() {
    const { AnswersController: AnswersController2 } = (init_answers_controller(), __toCommonJS(answers_controller_exports));
    return new AnswersController2(
      this.createAnswerUseCase,
      this.getAnswerUseCase,
      this.listAnswersUseCase,
      this.updateAnswerUseCase,
      this.deleteAnswerUseCase
    );
  }
  /**
   * Create candidates controller
   */
  createCandidatesController() {
    const { CandidatesController: CandidatesController2 } = (init_candidates_controller(), __toCommonJS(candidates_controller_exports));
    return new CandidatesController2(
      this.createCandidateUseCase,
      this.getCandidateUseCase,
      this.listCandidatesUseCase,
      this.updateCandidateUseCase,
      this.deleteCandidateUseCase
    );
  }
  /**
   * Create admin controller
   */
  createAdminController() {
    const { createAdminController: createAdminController2 } = (init_controller(), __toCommonJS(controller_exports));
    return createAdminController2();
  }
  /**
   * Create tags controller
   */
  createTagsController() {
    const { TagsController: TagsController2 } = (init_tags_controller(), __toCommonJS(tags_controller_exports));
    return new TagsController2(
      this.createTagUseCase,
      this.getTagUseCase,
      this.listTagsUseCase,
      this.updateTagUseCase,
      this.deleteTagUseCase
    );
  }
  /**
   * Create templates controller
   */
  createTemplatesController() {
    const { TemplatesController: TemplatesController2 } = (init_templates_controller(), __toCommonJS(templates_controller_exports));
    return new TemplatesController2(
      this.createTemplateUseCase,
      this.getTemplateUseCase,
      this.listTemplatesUseCase,
      this.updateTemplateUseCase,
      this.deleteTemplateUseCase
    );
  }
  /**
   * Create campaigns controller
   */
  createCampaignsController() {
    const { CampaignsController: CampaignsController2 } = (init_campaigns_controller(), __toCommonJS(campaigns_controller_exports));
    return new CampaignsController2(
      this.createCampaignUseCase,
      this.getCampaignUseCase,
      this.listCampaignsUseCase,
      this.updateCampaignUseCase,
      this.deleteCampaignUseCase
    );
  }
  // =========================================================================
  // CLEANUP
  // =========================================================================
  /**
   * Cleanup all resources
   */
  async shutdown() {
    console.log("\u{1F527} Shutting down infrastructure...");
    await this.eventBus.disconnect();
    console.log("\u2705 Event bus disconnected");
    await this.pg.close();
    console.log("\u2705 Database disconnected");
    await this.redis.quit();
    console.log("\u2705 Redis disconnected");
  }
};
function getContainer() {
  return DIContainer.getInstance();
}

// src/config/keycloak.config.ts
init_app_config();
import { authMiddleware, registerAuthRoutes, getAuthRoutesOpenAPI } from "@oxlayer/capabilities-auth";
var authOptions = {
  enableKeycloak: ENV.KEYCLOAK_ENABLED,
  keycloak: ENV.KEYCLOAK_SERVER_URL ? {
    url: ENV.KEYCLOAK_SERVER_URL,
    realm: ENV.KEYCLOAK_REALM || "globex",
    clientId: ENV.KEYCLOAK_CLIENT_ID || "globex-api"
  } : void 0,
  // Enable tenant context extraction from Keycloak JWT
  enableTenancy: true,
  // Enable JWT fallback for development without Keycloak
  // IMPORTANT: Disable when Keycloak is enabled to prevent algorithm mismatch
  enableJwt: !ENV.KEYCLOAK_ENABLED,
  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-change-in-production"
  },
  // Public paths that don't require authentication
  publicPaths: ["/health", "/public", "/docs", "/openapi.json", "/auth", "/api/auth", "/metrics"],
  // Enable token generation routes
  tokenRoutes: {
    enableAnonymous: true,
    enableKeycloak: ENV.KEYCLOAK_ENABLED,
    enableTenant: true,
    // Enable tenant token generation
    pathPrefix: "/auth",
    expiresIn: "7d"
  }
};
var extractUserIdMiddleware = async (c, next) => {
  const authPayload = c.get("authPayload");
  if (authPayload) {
    const userId = authPayload.sub || authPayload.user_id || authPayload.id;
    if (userId) {
      c.set("userId", String(userId));
    }
  }
  await next();
};
var keycloakConfig = {
  url: ENV.KEYCLOAK_SERVER_URL || "",
  realm: ENV.KEYCLOAK_REALM || "globex",
  clientId: ENV.KEYCLOAK_CLIENT_ID || "globex-api",
  // These would typically come from Bitwarden for service accounts
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET
};
function tenantContextPropagationMiddleware() {
  return async (c, next) => {
    const tenantContext = c.get("tenantContext");
    if (tenantContext) {
      const tenancyModule = await import("@oxlayer/pro-tenancy");
      const setTenantContext = tenancyModule.setTenantContext;
      if (typeof setTenantContext === "function") {
        return setTenantContext(tenantContext, next);
      }
    }
    await next();
  };
}
function getAdminAuthMiddleware() {
  return async (c, next) => {
    const { Logger } = await import("@oxlayer/capabilities-internal");
    const log = new Logger("admin-auth");
    log.debug("Admin auth middleware starting");
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      log.debug("Missing or invalid Authorization header");
      return c.json({ error: "Unauthorized", details: "Missing Authorization header" }, 401);
    }
    const token = authHeader.substring(7);
    log.debug("Token received", { tokenLength: token.length });
    const jwt = await import("jsonwebtoken");
    const jwksRsa = await import("jwks-rsa");
    let decoded;
    try {
      decoded = jwt.decode(token, { complete: true });
      log.debug("Token decoded successfully", { header: decoded.header });
    } catch (err) {
      log.error("Failed to decode token", { error: err });
      return c.json({ error: "Unauthorized", details: "Invalid token format" }, 401);
    }
    if (!decoded || typeof decoded === "string") {
      log.error("Invalid decoded token format");
      return c.json({ error: "Unauthorized", details: "Invalid token format" }, 401);
    }
    const payload = decoded.payload;
    const issuer = payload.iss;
    const kid = decoded.header.kid;
    log.debug("Token details", { issuer, kid });
    if (!issuer || !kid) {
      log.error("Missing issuer or kid in token");
      return c.json({ error: "Unauthorized", details: "Token missing issuer or kid" }, 401);
    }
    const realm = issuer.split("/").pop();
    if (!realm) {
      log.error("Could not extract realm from issuer", { issuer });
      return c.json({ error: "Unauthorized", details: "Invalid issuer format" }, 401);
    }
    log.debug("Extracted realm", { realm });
    const keycloakUrl = ENV.KEYCLOAK_SERVER_URL || issuer.substring(0, issuer.lastIndexOf("/realms/"));
    const jwksUri = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`;
    log.debug("Fetching JWKS", { jwksUri });
    const createClient = jwksRsa.jwksClient || jwksRsa.default;
    const client = createClient({
      jwksUri,
      cache: true,
      cacheMaxAge: 864e5,
      rateLimit: true,
      jwksRequestsPerMinute: 10
    });
    let signingKey;
    try {
      log.debug("Fetching signing key", { kid });
      signingKey = await new Promise((resolve, reject) => {
        client.getSigningKey(kid, (err, key) => {
          if (err) {
            log.error("getSigningKey error", { error: err });
            return reject(err);
          }
          log.debug("Signing key retrieved successfully");
          resolve(key.getPublicKey());
        });
      });
    } catch (err) {
      log.error("Failed to get signing key", { error: err?.message || err });
      return c.json({ error: "Unauthorized", details: "Failed to get signing key" }, 401);
    }
    try {
      log.debug("Verifying token...");
      const verified = jwt.verify(token, signingKey, {
        algorithms: ["RS256"],
        issuer
      });
      log.debug("Token verified successfully", { subject: verified.sub, realm_access: verified.realm_access?.roles });
      c.set("authPayload", verified);
      c.set("realm", realm);
      await next();
    } catch (verifyError) {
      log.error("Token verification failed", { error: verifyError?.message || verifyError });
      return c.json({ error: "Unauthorized", details: verifyError.message || "Token verification failed" }, 401);
    }
  };
}
var ALLOWED_KEYCLOAK_CLIENTS = /* @__PURE__ */ new Set([
  "globex_web",
  "globex_people",
  "globex_candidate",
  "globex_supervisor",
  "globex_manager",
  "globex_api",
  "example-app",
  "example-people",
  "example-admin"
]);
function getRealmAgnosticAuthMiddleware() {
  return async (c, next) => {
    const { Logger } = await import("@oxlayer/capabilities-internal");
    const log = new Logger("auth");
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      log.debug("Missing Authorization header");
      return c.json({ error: "Unauthorized", details: "Missing Authorization header" }, 401);
    }
    const token = authHeader.substring(7);
    const jwt = await import("jsonwebtoken");
    const jwksRsa = await import("jwks-rsa");
    let decoded;
    try {
      decoded = jwt.decode(token, { complete: true });
    } catch (err) {
      log.error("Failed to decode token", { error: err });
      return c.json({ error: "Unauthorized", details: "Invalid token format" }, 401);
    }
    if (!decoded || typeof decoded === "string") {
      log.error("Invalid decoded token format");
      return c.json({ error: "Unauthorized", details: "Invalid token format" }, 401);
    }
    const payload = decoded.payload;
    const issuer = payload.iss;
    const kid = decoded.header.kid;
    if (!issuer || !kid) {
      log.error("Missing issuer or kid in token");
      return c.json({ error: "Unauthorized", details: "Token missing issuer or kid" }, 401);
    }
    const realm = issuer.split("/").pop();
    if (!realm) {
      log.error("Could not extract realm from issuer", { issuer });
      return c.json({ error: "Unauthorized", details: "Invalid issuer format" }, 401);
    }
    const keycloakUrl = ENV.KEYCLOAK_SERVER_URL || issuer.substring(0, issuer.lastIndexOf("/realms/"));
    const jwksUri = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`;
    const createClient = jwksRsa.jwksClient || jwksRsa.default;
    const client = createClient({
      jwksUri,
      cache: true,
      cacheMaxAge: 864e5,
      rateLimit: true,
      jwksRequestsPerMinute: 10
    });
    let signingKey;
    try {
      signingKey = await new Promise((resolve, reject) => {
        client.getSigningKey(kid, (err, key) => {
          if (err) return reject(err);
          resolve(key.getPublicKey());
        });
      });
    } catch (err) {
      log.error("Failed to get signing key", { kid, realm, error: err?.message });
      return c.json({ error: "Unauthorized", details: "Failed to get signing key" }, 401);
    }
    try {
      const verified = jwt.verify(token, signingKey, {
        algorithms: ["RS256"],
        issuer
      });
      log.debug("Token verified", {
        realm,
        userId: verified.sub?.slice(0, 8),
        client: verified.azp
      });
      const azp = verified.azp || verified.client_id;
      if (azp && !ALLOWED_KEYCLOAK_CLIENTS.has(azp)) {
        log.warn("Client not in allow-list", { azp, realm });
        return c.json({
          error: "Forbidden",
          details: `Client "${azp}" is not authorized to access this API`
        }, 403);
      }
      let tenantContext = void 0;
      const hasOrganizationId = !!verified.organization_id;
      if (hasOrganizationId) {
        try {
          const { extractTenantContext } = await import("@oxlayer/capabilities-auth");
          tenantContext = extractTenantContext(verified, verified.organization_id);
          log.debug("Tenant context extracted", {
            realm: tenantContext.realm,
            workspaceId: tenantContext.workspaceId,
            organizationId: tenantContext.organizationId
          });
        } catch (err) {
          log.debug("Failed to extract tenant context", {
            organizationId: verified.organization_id,
            error: err?.message || err?.toString() || String(err)
          });
        }
      }
      c.set("authPayload", verified);
      c.set("authStrategy", "keycloak");
      c.set("isAuthenticated", true);
      c.set("realm", realm);
      c.set("userId", String(verified.sub));
      if (tenantContext) {
        c.set("tenantContext", tenantContext);
        c.set("tenantId", tenantContext.workspaceId);
        c.set("workspaceId", tenantContext.workspaceId);
      }
      await next();
    } catch (verifyError) {
      log.error("Token verification failed", { error: verifyError?.message || verifyError });
      return c.json({ error: "Unauthorized", details: verifyError.message || "Token verification failed" }, 401);
    }
  };
}

// src/app.ts
init_app_config();
import { registerAuthRoutes as registerAuthRoutes2, getAuthRoutesOpenAPI as getAuthRoutesOpenAPI2 } from "@oxlayer/capabilities-auth";
import { scalarMiddleware, openApiSpecMiddleware, errorHandlingMiddleware } from "@oxlayer/capabilities-openapi";

// src/config/openapi.config.ts
init_app_config();
var tenantDatabaseSchema = {
  type: "object",
  properties: {
    database: {
      type: "string",
      description: "Database name (format: workspace_{realm}_{workspaceId})"
    },
    realm: {
      type: "string",
      description: "Keycloak realm ID"
    },
    workspaceId: {
      type: "string",
      description: "Workspace ID"
    }
  },
  required: ["database", "realm", "workspaceId"]
};
var workspaceInputSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid",
      description: "Workspace ID"
    },
    name: {
      type: "string",
      description: "Workspace name"
    },
    organizationId: {
      type: "string",
      format: "uuid",
      description: "Organization ID"
    }
  },
  required: ["id", "name", "organizationId"]
};
var provisionTenantRequestSchema = {
  type: "object",
  properties: {
    realmId: {
      type: "string",
      description: "Keycloak realm ID (format: realm-{client-name})",
      example: "realm-acme"
    },
    displayName: {
      type: "string",
      description: "Display name for the client/tenant",
      example: "Acme"
    },
    workspaces: {
      type: "array",
      items: workspaceInputSchema,
      description: "List of workspaces to provision databases for"
    }
  },
  required: ["realmId", "displayName", "workspaces"]
};
var databaseResultSchema = {
  type: "object",
  properties: {
    workspaceId: {
      type: "string",
      description: "Workspace ID"
    },
    database: {
      type: "string",
      description: "Database name"
    },
    status: {
      type: "string",
      enum: ["created", "migrated", "failed"],
      description: "Database creation/migration status"
    },
    migrations: {
      type: "string",
      description: "Migration status message",
      nullable: true
    },
    error: {
      type: "string",
      description: "Error message if failed",
      nullable: true
    },
    migrationError: {
      type: "string",
      description: "Migration error message if failed",
      nullable: true
    }
  },
  required: ["workspaceId", "database", "status"]
};
var provisionTenantResponseSchema = {
  type: "object",
  properties: {
    success: {
      type: "boolean",
      description: "Whether provisioning succeeded"
    },
    message: {
      type: "string",
      description: "Status message"
    },
    results: {
      type: "object",
      properties: {
        realm: {
          type: "object",
          description: "Keycloak realm details"
        },
        databases: {
          type: "array",
          items: databaseResultSchema,
          description: "Database provisioning results for each workspace"
        }
      }
    }
  },
  required: ["success", "message"]
};
var listTenantsResponseSchema = {
  type: "object",
  properties: {
    success: {
      type: "boolean"
    },
    tenants: {
      type: "array",
      items: tenantDatabaseSchema
    }
  },
  required: ["success", "tenants"]
};
var createDatabaseRequestSchema = {
  type: "object",
  properties: {
    realm: {
      type: "string",
      description: "Keycloak realm ID",
      example: "realm-acme"
    },
    workspaceId: {
      type: "string",
      format: "uuid",
      description: "Workspace ID"
    }
  },
  required: ["realm", "workspaceId"]
};
var createDatabaseResponseSchema = {
  type: "object",
  properties: {
    success: {
      type: "boolean"
    },
    message: {
      type: "string"
    },
    database: {
      type: "string",
      description: "Database name"
    }
  },
  required: ["success", "message"]
};
var errorSchema = {
  type: "object",
  properties: {
    error: {
      type: "string",
      description: "Error type"
    },
    message: {
      type: "string",
      description: "Detailed error message"
    },
    code: {
      type: "string",
      description: "Error code"
    }
  },
  required: ["error"]
};
var examSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid",
      description: "Unique identifier for the exam"
    },
    workspaceId: {
      type: "string",
      format: "uuid",
      description: "ID of the workspace this exam belongs to"
    },
    examName: {
      type: "string",
      description: "Name of the exam"
    },
    durationMinutes: {
      type: "integer",
      description: "Duration of the exam in minutes"
    },
    createdAt: {
      type: "string",
      format: "date-time",
      description: "Timestamp when the exam was created"
    },
    updatedAt: {
      type: "string",
      format: "date-time",
      description: "Timestamp when the exam was last updated"
    }
  },
  required: ["id", "workspaceId", "examName", "durationMinutes", "createdAt", "updatedAt"]
};
var evaluationResultSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid",
      description: "Unique identifier for the evaluation result"
    },
    assignmentId: {
      type: "string",
      format: "uuid",
      description: "ID of the exam assignment"
    },
    candidateId: {
      type: "string",
      format: "uuid",
      description: "ID of the candidate"
    },
    examId: {
      type: "string",
      format: "uuid",
      description: "ID of the exam"
    },
    overallScore: {
      type: "number",
      format: "float",
      description: "Overall score achieved (0-100)"
    },
    completionStatus: {
      type: "string",
      enum: ["completed", "partial", "failed"],
      description: "Status of the evaluation"
    },
    transcriptions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          questionId: {
            type: "string",
            format: "uuid"
          },
          text: {
            type: "string"
          },
          confidence: {
            type: "number",
            format: "float"
          }
        }
      }
    },
    analysisResults: {
      type: "array",
      items: {
        type: "object"
      }
    },
    processedAt: {
      type: "string",
      format: "date-time",
      description: "Timestamp when processing completed"
    }
  },
  required: ["id", "assignmentId", "candidateId", "examId"]
};
var globexApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "FatorH API",
    description: `API for FatorH - an exam evaluation system with AI-powered transcription and analysis.

## Features

- **PostgreSQL**: Reliable data persistence
- **Redis Caching**: High-performance caching layer
- **RabbitMQ Events**: Event-driven architecture
- **Keycloak Authentication**: JWT-based security

## Authentication

Protected API endpoints require authentication via JWT tokens.

Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\``,
    version: ENV.SERVICE_VERSION,
    contact: {
      name: "OxLayer",
      url: "https://github.com/oxlayer/oxlayer"
    }
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Local development server"
    }
  ],
  tags: [
    {
      name: "Authentication",
      description: "Token generation and authentication endpoints"
    },
    {
      name: "Health",
      description: "Health check endpoints"
    },
    {
      name: "Admin",
      description: "Platform administration - tenant and realm provisioning (requires platform-admin role)"
    },
    {
      name: "Workspaces",
      description: "Workspace management endpoints"
    },
    {
      name: "Exams",
      description: "Exam management endpoints"
    },
    {
      name: "Questions",
      description: "Question management endpoints"
    },
    {
      name: "Answers",
      description: "Answer management endpoints"
    },
    {
      name: "Evaluations",
      description: "Evaluation and analysis endpoints"
    }
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        description: "Check the health status of the API and its dependencies",
        operationId: "getHealth",
        security: [],
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      example: "ok"
                    },
                    service: {
                      type: "string",
                      example: "globex-api"
                    },
                    version: {
                      type: "string",
                      example: "1.0.0"
                    },
                    timestamp: {
                      type: "string",
                      format: "date-time"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/tenants": {
      get: {
        tags: ["Admin"],
        summary: "List all tenant databases",
        description: "List all provisioned tenant databases across all realms. Requires platform-admin role.",
        operationId: "listTenants",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "List of tenant databases",
            content: {
              "application/json": {
                schema: listTenantsResponseSchema
              }
            }
          },
          "401": {
            description: "Unauthorized - Missing or invalid token",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "403": {
            description: "Forbidden - Requires platform-admin role",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      }
    },
    "/api/admin/realms/provision": {
      post: {
        tags: ["Admin"],
        summary: "Provision a new Keycloak realm",
        description: "Create a new Keycloak realm for a B2B client. Requires platform-admin role.",
        operationId: "provisionRealm",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  realmId: {
                    type: "string",
                    description: "Realm ID (format: realm-{client-name})",
                    example: "realm-acme"
                  },
                  displayName: {
                    type: "string",
                    description: "Display name for the client",
                    example: "Acme"
                  }
                },
                required: ["realmId", "displayName"]
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Realm provisioned successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    realm: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        realm: { type: "string" },
                        displayName: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "403": {
            description: "Forbidden - Requires platform-admin role",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      }
    },
    "/api/admin/databases/create": {
      post: {
        tags: ["Admin"],
        summary: "Create tenant database",
        description: "Create a new PostgreSQL database for a workspace. Requires platform-admin role.",
        operationId: "createDatabase",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: createDatabaseRequestSchema
            }
          }
        },
        responses: {
          "200": {
            description: "Database created successfully",
            content: {
              "application/json": {
                schema: createDatabaseResponseSchema
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "403": {
            description: "Forbidden - Requires platform-admin role",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      }
    },
    "/api/admin/databases/migrate": {
      post: {
        tags: ["Admin"],
        summary: "Run database migrations",
        description: "Run Drizzle migrations on a tenant database. Requires platform-admin role.",
        operationId: "migrateDatabase",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: createDatabaseRequestSchema
            }
          }
        },
        responses: {
          "200": {
            description: "Migrations completed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    migrations: {
                      type: "string",
                      description: "Migration results"
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "403": {
            description: "Forbidden - Requires platform-admin role",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      }
    },
    "/api/admin/tenants/provision": {
      post: {
        tags: ["Admin"],
        summary: "Provision a complete tenant",
        description: "Full tenant provisioning: creates realm, databases, and runs migrations for all workspaces. Requires platform-admin role.",
        operationId: "provisionTenant",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: provisionTenantRequestSchema
            }
          }
        },
        responses: {
          "200": {
            description: "Tenant provisioned successfully",
            content: {
              "application/json": {
                schema: provisionTenantResponseSchema
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "403": {
            description: "Forbidden - Requires platform-admin role",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      }
    },
    "/api/exams": {
      post: {
        tags: ["Exams"],
        summary: "Create exam",
        description: "Create a new exam with questions",
        operationId: "createExam",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  examName: {
                    type: "string",
                    minLength: 1,
                    maxLength: 255,
                    description: "Name of the exam"
                  },
                  durationMinutes: {
                    type: "integer",
                    minimum: 1,
                    default: 30,
                    description: "Duration in minutes"
                  },
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        priority: {
                          type: "integer",
                          minimum: 1,
                          description: "Order priority of the question"
                        },
                        text: {
                          type: "string",
                          minLength: 1,
                          description: "Question text"
                        },
                        type: {
                          type: "string",
                          enum: ["text", "audio"],
                          description: "Question type"
                        }
                      }
                    }
                  }
                },
                required: ["examName", "questions"]
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Exam created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    exam: examSchema
                  },
                  required: ["exam"]
                }
              }
            }
          },
          "400": {
            description: "Bad request - Validation error",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      },
      get: {
        tags: ["Exams"],
        summary: "List exams",
        description: "Retrieve a list of exams, optionally filtered by workspace",
        operationId: "listExams",
        security: [{ bearerAuth: [] }],
        parameters: [],
        responses: {
          "200": {
            description: "List of exams",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    exams: {
                      type: "array",
                      items: examSchema
                    }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      }
    },
    "/api/exams/{id}": {
      get: {
        tags: ["Exams"],
        summary: "Get exam by ID",
        description: "Retrieve a single exam with its questions",
        operationId: "getExamById",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Exam ID",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          "200": {
            description: "Exam found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    exam: examSchema
                  },
                  required: ["exam"]
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "404": {
            description: "Exam not found",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      }
    },
    "/api/evaluations/bulk": {
      post: {
        tags: ["Evaluations"],
        summary: "Bulk evaluate candidates",
        description: "Process audio answers for multiple candidates using AI transcription and analysis",
        operationId: "bulkEvaluate",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  examId: {
                    type: "string",
                    format: "uuid",
                    description: "ID of the exam to evaluate"
                  },
                  candidateIds: {
                    type: "array",
                    items: {
                      type: "string",
                      format: "uuid"
                    },
                    description: "List of candidate IDs to evaluate"
                  }
                },
                required: ["examId", "candidateIds"]
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Evaluation started successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    evaluations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          evaluationId: {
                            type: "string",
                            format: "uuid"
                          },
                          candidateId: {
                            type: "string",
                            format: "uuid"
                          },
                          status: {
                            type: "string",
                            enum: ["pending", "in_progress", "completed", "failed"]
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      }
    },
    "/api/evaluations/{id}": {
      get: {
        tags: ["Evaluations"],
        summary: "Get evaluation result",
        description: "Retrieve the evaluation result for a specific exam assignment",
        operationId: "getEvaluationById",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Evaluation result ID",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          "200": {
            description: "Evaluation result found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    evaluation: evaluationResultSchema
                  },
                  required: ["evaluation"]
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "404": {
            description: "Evaluation not found",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      }
    },
    "/api/workspaces": {
      post: {
        tags: ["Workspaces"],
        summary: "Create workspace",
        description: "Create a new workspace",
        operationId: "createWorkspace",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "organizationId"],
                properties: {
                  name: {
                    type: "string",
                    minLength: 1,
                    maxLength: 255,
                    description: "Workspace name"
                  },
                  description: {
                    type: "string",
                    description: "Workspace description"
                  },
                  organizationId: {
                    type: "string",
                    format: "uuid",
                    description: "Organization ID"
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Workspace created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    workspace: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        description: { type: "string", nullable: true },
                        organizationId: { type: "string", format: "uuid" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad request - Validation error",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      },
      get: {
        tags: ["Workspaces"],
        summary: "List workspaces",
        description: "Retrieve a list of workspaces",
        operationId: "listWorkspaces",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "organizationId",
            in: "query",
            description: "Filter by organization ID",
            schema: { type: "string", format: "uuid" }
          },
          {
            name: "limit",
            in: "query",
            description: "Limit results",
            schema: { type: "integer", default: 50 }
          },
          {
            name: "offset",
            in: "query",
            description: "Offset results",
            schema: { type: "integer", default: 0 }
          }
        ],
        responses: {
          "200": {
            description: "List of workspaces",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    workspaces: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          name: { type: "string" },
                          description: { type: "string", nullable: true },
                          organizationId: { type: "string", format: "uuid" },
                          createdAt: { type: "string", format: "date-time" },
                          updatedAt: { type: "string", format: "date-time" }
                        }
                      }
                    },
                    total: { type: "integer" },
                    limit: { type: "integer" },
                    offset: { type: "integer" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      }
    },
    "/api/workspaces/{id}": {
      get: {
        tags: ["Workspaces"],
        summary: "Get workspace by ID",
        description: "Retrieve a single workspace",
        operationId: "getWorkspaceById",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Workspace ID",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          "200": {
            description: "Workspace found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    workspace: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        description: { type: "string", nullable: true },
                        organizationId: { type: "string", format: "uuid" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "404": {
            description: "Workspace not found",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      },
      patch: {
        tags: ["Workspaces"],
        summary: "Update workspace",
        description: "Update a workspace",
        operationId: "updateWorkspace",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Workspace ID",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    minLength: 1,
                    maxLength: 255,
                    description: "Workspace name"
                  },
                  description: {
                    type: "string",
                    description: "Workspace description"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Workspace updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    workspace: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        description: { type: "string", nullable: true },
                        organizationId: { type: "string", format: "uuid" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "404": {
            description: "Workspace not found",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      },
      delete: {
        tags: ["Workspaces"],
        summary: "Delete workspace",
        description: "Delete a workspace (soft delete)",
        operationId: "deleteWorkspace",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Workspace ID",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          "200": {
            description: "Workspace deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "404": {
            description: "Workspace not found",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      }
    },
    "/api/questions": {
      post: {
        tags: ["Questions"],
        summary: "Create question",
        description: "Create a new question",
        operationId: "createQuestion",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["examId", "priority", "text", "type"],
                properties: {
                  examId: {
                    type: "string",
                    format: "uuid",
                    description: "ID of the exam"
                  },
                  priority: {
                    type: "integer",
                    minimum: 1,
                    description: "Question priority/order"
                  },
                  text: {
                    type: "string",
                    minLength: 1,
                    description: "Question text"
                  },
                  type: {
                    type: "string",
                    enum: ["text", "audio"],
                    description: "Question type"
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Question created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    question: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        examId: { type: "string", format: "uuid" },
                        priority: { type: "integer" },
                        text: { type: "string" },
                        type: { type: "string", enum: ["text", "audio"] },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      },
      get: {
        tags: ["Questions"],
        summary: "List questions",
        description: "Retrieve a list of questions",
        operationId: "listQuestions",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "examId",
            in: "query",
            description: "Filter by exam ID",
            schema: { type: "string", format: "uuid" }
          },
          {
            name: "type",
            in: "query",
            description: "Filter by type",
            schema: { type: "string", enum: ["text", "audio"] }
          },
          {
            name: "limit",
            in: "query",
            description: "Limit results",
            schema: { type: "integer", default: 50 }
          },
          {
            name: "offset",
            in: "query",
            description: "Offset results",
            schema: { type: "integer", default: 0 }
          }
        ],
        responses: {
          "200": {
            description: "List of questions",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    questions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          examId: { type: "string", format: "uuid" },
                          priority: { type: "integer" },
                          text: { type: "string" },
                          type: { type: "string", enum: ["text", "audio"] },
                          createdAt: { type: "string", format: "date-time" },
                          updatedAt: { type: "string", format: "date-time" }
                        }
                      }
                    },
                    total: { type: "integer" },
                    limit: { type: "integer" },
                    offset: { type: "integer" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      }
    },
    "/api/questions/{id}": {
      get: {
        tags: ["Questions"],
        summary: "Get question by ID",
        description: "Retrieve a single question",
        operationId: "getQuestionById",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Question ID",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          "200": {
            description: "Question found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    question: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        examId: { type: "string", format: "uuid" },
                        priority: { type: "integer" },
                        text: { type: "string" },
                        type: { type: "string", enum: ["text", "audio"] },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "404": {
            description: "Question not found",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      },
      patch: {
        tags: ["Questions"],
        summary: "Update question",
        description: "Update a question",
        operationId: "updateQuestion",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Question ID",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  priority: {
                    type: "integer",
                    minimum: 1,
                    description: "Question priority/order"
                  },
                  text: {
                    type: "string",
                    minLength: 1,
                    description: "Question text"
                  },
                  type: {
                    type: "string",
                    enum: ["text", "audio"],
                    description: "Question type"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Question updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    question: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        examId: { type: "string", format: "uuid" },
                        priority: { type: "integer" },
                        text: { type: "string" },
                        type: { type: "string", enum: ["text", "audio"] },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "404": {
            description: "Question not found",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      },
      delete: {
        tags: ["Questions"],
        summary: "Delete question",
        description: "Delete a question",
        operationId: "deleteQuestion",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Question ID",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          "200": {
            description: "Question deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "404": {
            description: "Question not found",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      }
    },
    "/api/answers": {
      post: {
        tags: ["Answers"],
        summary: "Create answer",
        description: "Create a new answer (candidate response to a question)",
        operationId: "createAnswer",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["assignmentId", "candidateId", "examId", "questionId", "s3Url", "duration", "contentType", "fileSize"],
                properties: {
                  assignmentId: {
                    type: "string",
                    format: "uuid",
                    description: "ID of the exam assignment"
                  },
                  candidateId: {
                    type: "string",
                    format: "uuid",
                    description: "ID of the candidate"
                  },
                  examId: {
                    type: "string",
                    format: "uuid",
                    description: "ID of the exam"
                  },
                  questionId: {
                    type: "string",
                    format: "uuid",
                    description: "ID of the question"
                  },
                  s3Url: {
                    type: "string",
                    format: "uri",
                    description: "S3 URL for audio file"
                  },
                  duration: {
                    type: "number",
                    format: "float",
                    description: "Duration in seconds"
                  },
                  contentType: {
                    type: "string",
                    description: "Content type (e.g., audio/mp3)"
                  },
                  fileSize: {
                    type: "number",
                    description: "File size in bytes"
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Answer created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    answer: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        assignmentId: { type: "string", format: "uuid" },
                        candidateId: { type: "string", format: "uuid" },
                        examId: { type: "string", format: "uuid" },
                        questionId: { type: "string", format: "uuid" },
                        s3Url: { type: "string" },
                        duration: { type: "number", format: "float" },
                        contentType: { type: "string" },
                        fileSize: { type: "number" },
                        isValid: { type: "boolean" },
                        transcription: { type: "string", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      },
      get: {
        tags: ["Answers"],
        summary: "List answers",
        description: "Retrieve a list of answers",
        operationId: "listAnswers",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "assignmentId",
            in: "query",
            description: "Filter by assignment ID",
            schema: { type: "string", format: "uuid" }
          },
          {
            name: "candidateId",
            in: "query",
            description: "Filter by candidate ID",
            schema: { type: "string", format: "uuid" }
          },
          {
            name: "examId",
            in: "query",
            description: "Filter by exam ID",
            schema: { type: "string", format: "uuid" }
          },
          {
            name: "questionId",
            in: "query",
            description: "Filter by question ID",
            schema: { type: "string", format: "uuid" }
          },
          {
            name: "isValid",
            in: "query",
            description: "Filter by validity",
            schema: { type: "boolean" }
          },
          {
            name: "limit",
            in: "query",
            description: "Limit results",
            schema: { type: "integer", default: 50 }
          },
          {
            name: "offset",
            in: "query",
            description: "Offset results",
            schema: { type: "integer", default: 0 }
          }
        ],
        responses: {
          "200": {
            description: "List of answers",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    answers: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          assignmentId: { type: "string", format: "uuid" },
                          candidateId: { type: "string", format: "uuid" },
                          examId: { type: "string", format: "uuid" },
                          questionId: { type: "string", format: "uuid" },
                          s3Url: { type: "string" },
                          duration: { type: "number", format: "float" },
                          contentType: { type: "string" },
                          fileSize: { type: "number" },
                          isValid: { type: "boolean" },
                          transcription: { type: "string", nullable: true },
                          createdAt: { type: "string", format: "date-time" },
                          updatedAt: { type: "string", format: "date-time" }
                        }
                      }
                    },
                    total: { type: "integer" },
                    limit: { type: "integer" },
                    offset: { type: "integer" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      }
    },
    "/api/answers/{id}": {
      get: {
        tags: ["Answers"],
        summary: "Get answer by ID",
        description: "Retrieve a single answer",
        operationId: "getAnswerById",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Answer ID",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          "200": {
            description: "Answer found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    answer: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        assignmentId: { type: "string", format: "uuid" },
                        candidateId: { type: "string", format: "uuid" },
                        examId: { type: "string", format: "uuid" },
                        questionId: { type: "string", format: "uuid" },
                        s3Url: { type: "string" },
                        duration: { type: "number", format: "float" },
                        contentType: { type: "string" },
                        fileSize: { type: "number" },
                        isValid: { type: "boolean" },
                        transcription: { type: "string", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "404": {
            description: "Answer not found",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      },
      patch: {
        tags: ["Answers"],
        summary: "Update answer",
        description: "Update an answer (e.g., add transcription or mark as valid)",
        operationId: "updateAnswer",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Answer ID",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  transcription: {
                    type: "string",
                    description: "Transcribed text"
                  },
                  isValid: {
                    type: "boolean",
                    description: "Whether the answer is valid"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Answer updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    answer: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        assignmentId: { type: "string", format: "uuid" },
                        candidateId: { type: "string", format: "uuid" },
                        examId: { type: "string", format: "uuid" },
                        questionId: { type: "string", format: "uuid" },
                        s3Url: { type: "string" },
                        duration: { type: "number", format: "float" },
                        contentType: { type: "string" },
                        fileSize: { type: "number" },
                        isValid: { type: "boolean" },
                        transcription: { type: "string", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "404": {
            description: "Answer not found",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      },
      delete: {
        tags: ["Answers"],
        summary: "Delete answer",
        description: "Delete an answer",
        operationId: "deleteAnswer",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "Answer ID",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          "200": {
            description: "Answer deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          },
          "404": {
            description: "Answer not found",
            content: {
              "application/json": {
                schema: errorSchema
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Error: errorSchema,
      Exam: examSchema,
      EvaluationResult: evaluationResultSchema,
      Workspace: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", description: "Unique identifier for the workspace" },
          name: { type: "string", description: "Workspace name" },
          description: { type: "string", nullable: true, description: "Workspace description" },
          organizationId: { type: "string", format: "uuid", description: "ID of the organization" },
          createdAt: { type: "string", format: "date-time", description: "Timestamp when the workspace was created" },
          updatedAt: { type: "string", format: "date-time", description: "Timestamp when the workspace was last updated" }
        }
      },
      Question: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", description: "Unique identifier for the question" },
          examId: { type: "string", format: "uuid", description: "ID of the exam this question belongs to" },
          priority: { type: "integer", description: "Order priority of the question" },
          text: { type: "string", description: "Question text" },
          type: { type: "string", enum: ["text", "audio"], description: "Question type" },
          createdAt: { type: "string", format: "date-time", description: "Timestamp when the question was created" },
          updatedAt: { type: "string", format: "date-time", description: "Timestamp when the question was last updated" }
        }
      },
      Answer: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", description: "Unique identifier for the answer" },
          assignmentId: { type: "string", format: "uuid", description: "ID of the exam assignment" },
          candidateId: { type: "string", format: "uuid", description: "ID of the candidate" },
          examId: { type: "string", format: "uuid", description: "ID of the exam" },
          questionId: { type: "string", format: "uuid", description: "ID of the question" },
          s3Url: { type: "string", description: "S3 URL for audio file" },
          duration: { type: "number", format: "float", description: "Duration in seconds" },
          contentType: { type: "string", description: "Content type (e.g., audio/mp3)" },
          fileSize: { type: "number", description: "File size in bytes" },
          isValid: { type: "boolean", description: "Whether the answer is valid" },
          transcription: { type: "string", nullable: true, description: "Transcribed text" },
          createdAt: { type: "string", format: "date-time", description: "Timestamp when the answer was created" },
          updatedAt: { type: "string", format: "date-time", description: "Timestamp when the answer was last updated" }
        }
      }
    },
    schemas: {
      Error: errorSchema,
      Exam: examSchema,
      EvaluationResult: evaluationResultSchema
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token for authentication"
      }
    }
  }
};

// src/config/metrics.config.ts
init_app_config();
import { createMetricsMiddleware, createTelemetryMiddleware } from "@oxlayer/capabilities-telemetry";
var telemetryClient;
var telemetryMiddleware;
var metricsOptions = {
  prefix: "globex_api",
  labels: {
    service: ENV.SERVICE_NAME,
    version: ENV.SERVICE_VERSION,
    environment: ENV.NODE_ENV
  },
  path: "/metrics"
};
function getMetricsMiddleware() {
  const { metrics, middleware } = createMetricsMiddleware(metricsOptions);
  return { metrics, middleware };
}
var telemetryOptions = {
  serviceName: ENV.SERVICE_NAME,
  serviceVersion: ENV.SERVICE_VERSION,
  // Send traces to OTEL Collector or directly to Quickwit
  otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
  // Enable in development for demo, or in production
  enabled: !!process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || ENV.NODE_ENV === "production",
  quickwit: {
    indexId: process.env.QUICKWIT_TRACES_INDEX_ID,
    url: process.env.QUICKWIT_URL || "http://localhost:7280"
  }
};
async function initializeTelemetry() {
  if (!process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT) {
    console.warn("[Telemetry] OTEL_EXPORTER_OTLP_TRACES_ENDPOINT not set, skipping telemetry initialization");
    return;
  }
  if (telemetryClient && telemetryClient.isReady()) {
    console.warn("[Telemetry] Already initialized, skipping");
    return;
  }
  if (telemetryClient && !telemetryClient.isReady()) {
    console.log("[Telemetry] Client exists but not initialized, initializing now...");
    await telemetryClient.initialize();
    console.log("[Telemetry] Initialized eagerly during startup");
    return;
  }
  const { middleware, client } = createTelemetryMiddleware(telemetryOptions);
  telemetryClient = client;
  telemetryMiddleware = middleware;
  await client.initialize();
  console.log("[Telemetry] Initialized eagerly during startup");
}
function getTelemetryMiddleware() {
  if (!process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT) {
    return async (c, next) => next();
  }
  if (telemetryMiddleware) {
    return telemetryMiddleware;
  }
  const { middleware, client } = createTelemetryMiddleware(telemetryOptions);
  telemetryClient = client;
  telemetryMiddleware = middleware;
  return middleware;
}
async function shutdownTelemetry() {
  if (telemetryClient) {
    await telemetryClient.shutdown();
  }
}

// src/app.ts
init_admin_db_config();
import { generateAnonymousToken } from "@oxlayer/capabilities-auth";
var app = new Hono();
var container = getContainer();
var authRoutesOpenAPI = getAuthRoutesOpenAPI2(authOptions);
globexApiSpec.paths = { ...globexApiSpec.paths, ...authRoutesOpenAPI };
var { middleware: metricsMiddleware } = getMetricsMiddleware();
app.use("*", metricsMiddleware);
app.use("*", getTelemetryMiddleware());
app.use("*", cors({
  origin: "*",
  allowHeaders: ["Authorization", "Content-Type", "X-User-ID", "X-Session-ID", "X-Admin-Key"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
  credentials: true
}));
app.use("*", logger());
app.use("*", scalarMiddleware({
  title: "FatorH API Documentation",
  specUrl: "/openapi.json",
  path: "/docs"
}));
app.use("*", openApiSpecMiddleware(globexApiSpec, {
  title: "FatorH API",
  description: "Interactive API documentation for FatorH with OxLayer",
  version: ENV.SERVICE_VERSION,
  path: "/openapi.json"
}));
app.get("/health", async (c) => {
  let dbHealthy = false;
  let redisHealthy = false;
  try {
    await container.pg.db.execute({ sql: "SELECT 1" });
    dbHealthy = true;
  } catch {
    dbHealthy = false;
  }
  try {
    await container.redis.set("health", "ok");
    await container.redis.del("health");
    redisHealthy = true;
  } catch {
    redisHealthy = false;
  }
  return c.json({
    status: "ok",
    service: ENV.SERVICE_NAME,
    version: ENV.SERVICE_VERSION,
    services: {
      database: dbHealthy,
      redis: redisHealthy,
      eventBus: true
      // TODO: add actual event bus health check
    },
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
registerAuthRoutes2(app, authOptions);
app.post("/auth/token/anonymous", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, metadata } = body;
    if (!userId) {
      return c.json({ error: "userId is required" }, 400);
    }
    const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-in-production";
    const result = generateAnonymousToken({ userId, metadata }, { secret: jwtSecret, expiresIn: "7d" });
    return c.json(result);
  } catch (error) {
    return c.json({ error: error.message || "Unknown error" }, 400);
  }
});
app.get("/api/admin/tenants", getAdminAuthMiddleware(), (c) => container.createAdminController().listTenants(c));
app.get("/api/admin/tenants/:realmId", getAdminAuthMiddleware(), (c) => container.createAdminController().getTenant(c));
app.get("/api/admin/users", getAdminAuthMiddleware(), (c) => container.createAdminController().listUsers(c));
app.get("/api/admin/realms", getAdminAuthMiddleware(), (c) => container.createAdminController().listRealms(c));
app.post("/api/admin/realms/provision", getAdminAuthMiddleware(), (c) => container.createAdminController().provisionRealm(c));
app.post("/api/admin/databases/create", getAdminAuthMiddleware(), (c) => container.createAdminController().createDatabase(c));
app.post("/api/admin/databases/migrate", getAdminAuthMiddleware(), (c) => container.createAdminController().migrateDatabase(c));
app.post("/api/admin/tenants/provision", getAdminAuthMiddleware(), (c) => container.createAdminController().provisionTenant(c));
app.post("/api/admin/workspaces/provision", getAdminAuthMiddleware(), (c) => container.createAdminController().provisionWorkspace(c));
app.post("/api/admin/tenants/:realmId/organizations/retry", getAdminAuthMiddleware(), (c) => container.createAdminController().retryOrganization(c));
app.delete("/api/admin/tenants/:realmId", getAdminAuthMiddleware(), (c) => container.createAdminController().deleteTenant(c));
app.delete("/api/admin/tenants/:realmId/realm", getAdminAuthMiddleware(), (c) => container.createAdminController().deleteRealm(c));
app.delete("/api/admin/databases", getAdminAuthMiddleware(), (c) => container.createAdminController().deleteDatabase(c));
app.post("/api/admin/tenants/:realmId/realm/recreate", getAdminAuthMiddleware(), (c) => container.createAdminController().recreateRealm(c));
app.post("/api/admin/databases/recreate", getAdminAuthMiddleware(), (c) => container.createAdminController().recreateDatabase(c));
app.post("/api/admin/databases/rotate-credentials", getAdminAuthMiddleware(), (c) => container.createAdminController().rotateCredentials(c));
var api = new Hono();
api.use("*", getRealmAgnosticAuthMiddleware());
api.use("*", extractUserIdMiddleware);
api.use("*", tenantContextPropagationMiddleware());
api.post("/exams", (c) => container.createExamsController().create(c));
api.get("/exams", (c) => container.createExamsController().list(c));
api.get("/exams/:id/questions", (c) => container.createExamsController().getWithQuestions(c));
api.get("/exams/:id", (c) => container.createExamsController().getById(c));
api.patch("/exams/:id", (c) => container.createExamsController().update(c));
api.delete("/exams/:id", (c) => container.createExamsController().delete(c));
api.post("/evaluations/bulk", (c) => container.createEvaluationsController().bulkEvaluate(c));
api.get("/evaluations/results", (c) => container.createEvaluationsController().list(c));
api.get("/evaluations/by-exam-cpf", (c) => container.createEvaluationsController().getByExamAndCpf(c));
api.get("/evaluations/:id", (c) => container.createEvaluationsController().getById(c));
api.post("/workspaces", (c) => container.createWorkspacesController().create(c));
api.get("/workspaces", (c) => container.createWorkspacesController().list(c));
api.get("/workspaces/:id", (c) => container.createWorkspacesController().getById(c));
api.patch("/workspaces/:id", (c) => container.createWorkspacesController().update(c));
api.delete("/workspaces/:id", (c) => container.createWorkspacesController().delete(c));
api.post("/organizations/provision", (c) => container.createAdminController().provisionOrganization(c));
api.post("/questions", (c) => container.createQuestionsController().create(c));
api.get("/questions", (c) => container.createQuestionsController().list(c));
api.get("/questions/:id", (c) => container.createQuestionsController().getById(c));
api.patch("/questions/:id", (c) => container.createQuestionsController().update(c));
api.delete("/questions/:id", (c) => container.createQuestionsController().delete(c));
api.post("/answers", (c) => container.createAnswersController().create(c));
api.get("/answers", (c) => container.createAnswersController().list(c));
api.get("/answers/:id", (c) => container.createAnswersController().getById(c));
api.patch("/answers/:id", (c) => container.createAnswersController().update(c));
api.delete("/answers/:id", (c) => container.createAnswersController().delete(c));
api.post("/candidates", (c) => container.createCandidatesController().create(c));
api.get("/candidates", (c) => container.createCandidatesController().list(c));
api.get("/candidates/:id", (c) => container.createCandidatesController().getById(c));
api.patch("/candidates/:id", (c) => container.createCandidatesController().update(c));
api.delete("/candidates/:id", (c) => container.createCandidatesController().delete(c));
api.post("/tags", (c) => container.createTagsController().create(c));
api.get("/tags", (c) => container.createTagsController().list(c));
api.get("/tags/keys", (c) => container.createTagsController().getKeys(c));
api.get("/tags/values/:key", (c) => container.createTagsController().getValuesByKey(c));
api.get("/tags/:id", (c) => container.createTagsController().getById(c));
api.patch("/tags/:id", (c) => container.createTagsController().update(c));
api.delete("/tags/:id", (c) => container.createTagsController().delete(c));
api.post("/templates", (c) => container.createTemplatesController().create(c));
api.get("/templates", (c) => container.createTemplatesController().list(c));
api.get("/templates/:id", (c) => container.createTemplatesController().getById(c));
api.patch("/templates/:id", (c) => container.createTemplatesController().update(c));
api.delete("/templates/:id", (c) => container.createTemplatesController().delete(c));
api.post("/campaigns", (c) => container.createCampaignsController().create(c));
api.get("/campaigns", (c) => container.createCampaignsController().list(c));
api.get("/campaigns/:id", (c) => container.createCampaignsController().getById(c));
api.patch("/campaigns/:id", (c) => container.createCampaignsController().update(c));
api.delete("/campaigns/:id", (c) => container.createCampaignsController().delete(c));
app.route("/api", api);
app.notFound((c) => {
  return c.json({ error: "Not Found", message: `Route ${c.req.path} not found` }, 404);
});
app.onError(errorHandlingMiddleware({
  logLevel: ENV.NODE_ENV === "production" ? "INFO" : "DEBUG",
  nodeEnv: ENV.NODE_ENV,
  includeStackInLogs: ENV.NODE_ENV === "development"
}));
async function main() {
  console.log("");
  console.log("\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
  console.log("\u2551           FatorH API - OxLayer                     \u2551");
  console.log("\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D");
  console.log("");
  await initializeTelemetry();
  await container.initialize();
  console.log("\u{1F510} Initializing admin database...");
  await initAdminDbOnStartup();
  const server = globalThis.Bun?.serve({
    fetch: app.fetch,
    hostname: ENV.HOST,
    port: Number(ENV.PORT)
  });
  console.log(`\u{1F680} Server running at http://${ENV.HOST}:${ENV.PORT}`);
  console.log("");
  console.log("Endpoints:");
  console.log(`  GET    /health              - Health check`);
  console.log(`  GET    /metrics             - Prometheus metrics`);
  console.log(`  GET    /docs                - API Documentation (Scalar)`);
  console.log(`  GET    /openapi.json        - OpenAPI Specification`);
  console.log("");
  console.log("  Authentication Routes (public):");
  console.log(`  POST   /auth/token/anonymous - Generate anonymous JWT token`);
  if (ENV.KEYCLOAK_ENABLED) {
    console.log(`  POST   /auth/token/keycloak  - Login with Keycloak credentials`);
  }
  console.log("");
  console.log(`  Protected Routes (authentication required):`);
  console.log(`  POST   /api/exams           - Create exam`);
  console.log(`  GET    /api/exams           - List exams`);
  console.log(`  GET    /api/exams/:id       - Get exam`);
  console.log(`  GET    /api/exams/:id/questions - Get exam with questions`);
  console.log(`  DELETE /api/exams/:id       - Delete exam`);
  console.log("");
  console.log(`  POST   /api/evaluations/bulk - Bulk evaluate candidates`);
  console.log(`  GET    /api/evaluations/:id - Get evaluation result`);
  console.log(`  GET    /api/evaluations/by-exam-cpf - Get evaluation by exam and CPF`);
  console.log("");
  console.log(`  Workspaces:`);
  console.log(`  POST   /api/workspaces      - Create workspace`);
  console.log(`  GET    /api/workspaces      - List workspaces`);
  console.log(`  GET    /api/workspaces/:id  - Get workspace`);
  console.log(`  PATCH  /api/workspaces/:id  - Update workspace`);
  console.log(`  DELETE /api/workspaces/:id  - Delete workspace`);
  console.log("");
  console.log(`  Questions:`);
  console.log(`  POST   /api/questions       - Create question`);
  console.log(`  GET    /api/questions       - List questions`);
  console.log(`  GET    /api/questions/:id   - Get question`);
  console.log(`  PATCH  /api/questions/:id   - Update question`);
  console.log(`  DELETE /api/questions/:id   - Delete question`);
  console.log("");
  console.log(`  Answers:`);
  console.log(`  POST   /api/answers         - Create answer`);
  console.log(`  GET    /api/answers         - List answers`);
  console.log(`  GET    /api/answers/:id     - Get answer`);
  console.log(`  PATCH  /api/answers/:id     - Update answer`);
  console.log(`  DELETE /api/answers/:id     - Delete answer`);
  console.log("");
  console.log(`  Candidates:`);
  console.log(`  POST   /api/candidates       - Create candidate`);
  console.log(`  GET    /api/candidates       - List candidates`);
  console.log(`  GET    /api/candidates/:id   - Get candidate`);
  console.log(`  PATCH  /api/candidates/:id   - Update candidate`);
  console.log(`  DELETE /api/candidates/:id   - Delete candidate`);
  console.log("");
  console.log(`  Tags:`);
  console.log(`  POST   /api/tags            - Create tag`);
  console.log(`  GET    /api/tags            - List tags`);
  console.log(`  GET    /api/tags/keys       - Get unique tag keys`);
  console.log(`  GET    /api/tags/values/:key - Get values for key`);
  console.log(`  GET    /api/tags/:id        - Get tag`);
  console.log(`  PATCH  /api/tags/:id        - Update tag`);
  console.log(`  DELETE /api/tags/:id        - Delete tag`);
  console.log("");
  console.log(`  Templates:`);
  console.log(`  POST   /api/templates       - Create template`);
  console.log(`  GET    /api/templates       - List templates`);
  console.log(`  GET    /api/templates/:id   - Get template`);
  console.log(`  PATCH  /api/templates/:id   - Update template`);
  console.log(`  DELETE /api/templates/:id   - Delete template`);
  console.log("");
  console.log(`  Campaigns:`);
  console.log(`  POST   /api/campaigns       - Create campaign`);
  console.log(`  GET    /api/campaigns       - List campaigns`);
  console.log(`  GET    /api/campaigns/:id   - Get campaign`);
  console.log(`  PATCH  /api/campaigns/:id   - Update campaign`);
  console.log(`  DELETE /api/campaigns/:id   - Delete campaign`);
  console.log("");
  console.log("Observability:");
  console.log(`  \u{1F4CA} Metrics:   http://localhost:${ENV.PORT}/metrics (Prometheus)`);
  console.log(`  \u{1F50D} Traces:    http://localhost:16686 (Jaeger UI)`);
  console.log(`  \u{1F4C8} Dashboards: http://localhost:3000 (Grafana)`);
  console.log("");
  console.log("Features:");
  console.log(`  \u2705 Keycloak Authentication with Multi-Tenancy`);
  console.log(`  \u2705 Realm-based tenant isolation (legal/security boundary)`);
  console.log(`  \u2705 Workspace-based database isolation (data boundary)`);
  console.log(`  \u2705 Organization-based business boundary`);
  console.log(`  \u2705 PostgreSQL with Drizzle ORM`);
  console.log(`  \u2705 Redis Caching`);
  console.log(`  \u2705 RabbitMQ Events`);
  console.log(`  \u2705 Prometheus Metrics`);
  console.log(`  \u2705 OpenTelemetry Tracing`);
  console.log(`  \u2705 OpenAPI Documentation`);
  console.log("");
  const shutdown = async () => {
    console.log("");
    console.log("\u{1F6D1} Shutting down gracefully...");
    await shutdownTelemetry();
    await container.shutdown();
    server.stop();
    console.log("\u{1F44B} Goodbye!");
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
if (import.meta.main) {
  main().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}

// src/server.ts
async function start() {
  await initDatabase();
  await main();
}
start().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});
//# sourceMappingURL=server.js.map