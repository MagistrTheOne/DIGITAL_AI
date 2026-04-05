-- Employee client API integrations + pgvector knowledge chunks.
-- Requires Neon/pg with pgvector. Apply: psql "$DATABASE_URL" -f drizzle/0009_integrations_rag.sql
--   OR: npm run db:push (after schema pull)

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS "employee_integration" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"employee_id" text NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
	"kind" text DEFAULT 'client_api' NOT NULL,
	"name" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"secret_ciphertext" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "employee_integration_user_employee_idx" ON "employee_integration" ("user_id", "employee_id");

CREATE TABLE IF NOT EXISTS "knowledge_document" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"employee_id" text NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
	"source_label" text NOT NULL,
	"mime" text DEFAULT 'text/plain' NOT NULL,
	"byte_length" integer DEFAULT 0 NOT NULL,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "knowledge_document_user_employee_idx" ON "knowledge_document" ("user_id", "employee_id");

CREATE TABLE IF NOT EXISTS "knowledge_chunk" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL REFERENCES "knowledge_document"("id") ON DELETE CASCADE,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"employee_id" text NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"embedding" vector(1536) NOT NULL
);

CREATE INDEX IF NOT EXISTS "knowledge_chunk_user_employee_idx" ON "knowledge_chunk" ("user_id", "employee_id");
