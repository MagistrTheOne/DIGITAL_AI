-- AI workforce telemetry: sessions, usage events, optional daily rollups.
-- Apply: psql "$DATABASE_URL" -f drizzle/0003_analytics.sql

CREATE TABLE IF NOT EXISTS "ai_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"employee_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"latency_ms" integer,
	"success" boolean,
	"tokens_used" integer DEFAULT 0 NOT NULL,
	"cost_saved_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ai_sessions_user_started_idx" ON "ai_sessions" USING btree ("user_id","started_at");
CREATE INDEX IF NOT EXISTS "ai_sessions_user_employee_idx" ON "ai_sessions" USING btree ("user_id","employee_id");
CREATE INDEX IF NOT EXISTS "ai_sessions_user_ended_idx" ON "ai_sessions" USING btree ("user_id","ended_at");

CREATE TABLE IF NOT EXISTS "usage_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"session_id" text REFERENCES "ai_sessions"("id") ON DELETE SET NULL,
	"event_type" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "usage_events_user_created_idx" ON "usage_events" USING btree ("user_id","created_at");
CREATE INDEX IF NOT EXISTS "usage_events_session_idx" ON "usage_events" USING btree ("session_id");

CREATE TABLE IF NOT EXISTS "ai_metrics_daily" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"day" date NOT NULL,
	"sessions_count" integer DEFAULT 0 NOT NULL,
	"tokens_total" bigint DEFAULT 0 NOT NULL,
	"cost_saved_cents" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_metrics_daily_user_day_uq" ON "ai_metrics_daily" USING btree ("user_id","day");
CREATE INDEX IF NOT EXISTS "ai_metrics_daily_user_day_idx" ON "ai_metrics_daily" USING btree ("user_id","day");
