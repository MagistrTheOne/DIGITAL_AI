-- Digital employees per user (replaces legacy shape if present).
-- Apply: psql "$DATABASE_URL" -f drizzle/0004_employees.sql

DROP TABLE IF EXISTS "employees" CASCADE;

CREATE TABLE "employees" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "employees_user_idx" ON "employees" USING btree ("user_id");
