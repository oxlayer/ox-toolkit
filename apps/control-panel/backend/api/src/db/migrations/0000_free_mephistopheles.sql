CREATE TYPE "public"."api_key_scope" AS ENUM('read', 'write', 'admin', 'install');--> statement-breakpoint
CREATE TYPE "public"."api_key_status" AS ENUM('active', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."environment" AS ENUM('development', 'staging', 'production');--> statement-breakpoint
CREATE TYPE "public"."license_status" AS ENUM('active', 'suspended', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."license_tier" AS ENUM('starter', 'professional', 'enterprise', 'custom');--> statement-breakpoint
CREATE TYPE "public"."sdk_package_type" AS ENUM('backend-sdk', 'frontend-sdk', 'cli-tools', 'channels');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"developer_id" text,
	"license_id" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"name" text NOT NULL,
	"scopes" jsonb DEFAULT '["read"]' NOT NULL,
	"environments" jsonb DEFAULT '["development"]' NOT NULL,
	"status" "api_key_status" DEFAULT 'active' NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "developers" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"environments" jsonb DEFAULT '["development"]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "developers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "licenses" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"tier" "license_tier" DEFAULT 'starter' NOT NULL,
	"status" "license_status" DEFAULT 'active' NOT NULL,
	"packages" jsonb DEFAULT '[]' NOT NULL,
	"capabilities" jsonb DEFAULT '{}' NOT NULL,
	"environments" jsonb DEFAULT '["development"]' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"tier" "license_tier" DEFAULT 'starter' NOT NULL,
	"max_developers" integer DEFAULT 5 NOT NULL,
	"max_projects" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "usage_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"license_id" text,
	"api_key_id" text,
	"endpoint" text NOT NULL,
	"environment" text NOT NULL,
	"capabilities_requested" jsonb DEFAULT '[]' NOT NULL,
	"resolved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_developer_id_developers_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."developers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_license_id_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."licenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developers" ADD CONSTRAINT "developers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_license_id_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."licenses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_api_keys_organization_id" ON "api_keys" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_api_keys_developer_id" ON "api_keys" USING btree ("developer_id");--> statement-breakpoint
CREATE INDEX "idx_api_keys_license_id" ON "api_keys" USING btree ("license_id");--> statement-breakpoint
CREATE INDEX "idx_api_keys_key_hash" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "idx_api_keys_status" ON "api_keys" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_api_keys_key_hash_unique" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "idx_developers_organization_id" ON "developers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_developers_email" ON "developers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_licenses_organization_id" ON "licenses" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_licenses_status" ON "licenses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_licenses_expires_at" ON "licenses" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_organizations_slug" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_organizations_tier" ON "organizations" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "idx_usage_logs_organization_id" ON "usage_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_usage_logs_license_id" ON "usage_logs" USING btree ("license_id");--> statement-breakpoint
CREATE INDEX "idx_usage_logs_resolved_at" ON "usage_logs" USING btree ("resolved_at");