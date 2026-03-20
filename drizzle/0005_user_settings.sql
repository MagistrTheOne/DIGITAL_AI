-- Per-user AI runtime settings (Settings UI + workers).
-- Apply: npm run db:push   OR   psql "$DATABASE_URL" -f drizzle/0005_user_settings.sql

CREATE TABLE IF NOT EXISTS "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"tone" text DEFAULT 'formal' NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"voice_enabled" boolean DEFAULT true NOT NULL,
	"latency_vs_quality" integer DEFAULT 62 NOT NULL,
	"streaming" boolean DEFAULT true NOT NULL,
	"avatar_quality" text DEFAULT 'high' NOT NULL,
	"tts_voice" text DEFAULT 'nova' NOT NULL,
	"stt_model" text DEFAULT 'whisper-large' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
