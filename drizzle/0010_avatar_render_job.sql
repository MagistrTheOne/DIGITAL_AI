-- Multi-engine avatar render jobs (RunPod Ditto / ARACHNE-X T2V).
-- Apply: npm run db:push OR psql "$DATABASE_URL" -f drizzle/0010_avatar_render_job.sql

CREATE TABLE IF NOT EXISTS "avatar_render_job" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"employee_id" text NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
	"session_id" text NOT NULL,
	"sequence" integer NOT NULL,
	"engine_requested" text NOT NULL,
	"engine_used" text,
	"video_tier" text NOT NULL,
	"parent_job_id" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"video_url" text,
	"error" text,
	"runpod_job_id" text,
	"runpod_endpoint_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "avatar_render_job_session_seq_tier_uq" ON "avatar_render_job" ("user_id","session_id","sequence","video_tier");
CREATE INDEX IF NOT EXISTS "avatar_render_job_user_status_idx" ON "avatar_render_job" ("user_id","status");
CREATE INDEX IF NOT EXISTS "avatar_render_job_employee_idx" ON "avatar_render_job" ("employee_id");
