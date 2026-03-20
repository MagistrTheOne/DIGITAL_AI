-- Plan assignment on user + subscription table for future billing (Polar, etc.).
-- Apply in Neon SQL Editor or: psql "$DATABASE_URL" -f drizzle/0002_plan_and_subscription.sql

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "plan_type" text NOT NULL DEFAULT 'FREE';

CREATE TABLE IF NOT EXISTS "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"plan_type" text NOT NULL,
	"status" text NOT NULL,
	"provider" text,
	"external_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "subscription_userId_idx" ON "subscription" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "subscription_provider_external_idx" ON "subscription" USING btree ("provider","external_id");
