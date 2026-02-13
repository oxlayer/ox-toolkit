-- Add device_code_hash column as nullable first
ALTER TABLE "device_sessions" ADD COLUMN "device_code_hash" text;--> statement-breakpoint
-- Backfill existing rows with hash of device_code
UPDATE "device_sessions" SET "device_code_hash" = encode(sha256("device_code"::bytea), 'hex') WHERE "device_code_hash" IS NULL;--> statement-breakpoint
-- Now make the column NOT NULL
ALTER TABLE "device_sessions" ALTER COLUMN "device_code_hash" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_device_sessions_device_code_hash" ON "device_sessions" USING btree ("device_code_hash");
