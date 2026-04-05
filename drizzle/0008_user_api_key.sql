-- User-issued API keys (SHA-256 hash only at rest).
-- Apply: npm run db:push   OR   psql "$DATABASE_URL" -f drizzle/0008_user_api_key.sql

CREATE TABLE IF NOT EXISTS "user_api_key" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"key_hash" text NOT NULL UNIQUE,
	"prefix" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "user_api_key_userId_idx" ON "user_api_key" ("user_id");
CREATE INDEX IF NOT EXISTS "user_api_key_keyHash_idx" ON "user_api_key" ("key_hash");
