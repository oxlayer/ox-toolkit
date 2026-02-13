CREATE TABLE "package_releases" (
	"id" text PRIMARY KEY NOT NULL,
	"package_type" "sdk_package_type" NOT NULL,
	"version" text NOT NULL,
	"checksum" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"r2_key" text NOT NULL,
	"is_latest" timestamp DEFAULT now() NOT NULL,
	"released_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_package_releases_package_type" ON "package_releases" USING btree ("package_type");--> statement-breakpoint
CREATE INDEX "idx_package_releases_version" ON "package_releases" USING btree ("version");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_package_releases_type_version" ON "package_releases" USING btree ("package_type","version");--> statement-breakpoint
CREATE INDEX "idx_package_releases_is_latest" ON "package_releases" USING btree ("is_latest");