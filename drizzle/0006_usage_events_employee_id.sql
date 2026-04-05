-- Link usage_events to employees for per-agent turn analytics + plan usage (chat turns).
-- Apply: psql "$DATABASE_URL" -f drizzle/0006_usage_events_employee_id.sql

ALTER TABLE "usage_events" ADD COLUMN IF NOT EXISTS "employee_id" text;

UPDATE "usage_events" ue
SET "employee_id" = a."employee_id"
FROM "ai_sessions" a
WHERE ue."session_id" = a."id"
  AND ue."employee_id" IS NULL;

CREATE INDEX IF NOT EXISTS "usage_events_user_employee_created_idx"
  ON "usage_events" USING btree ("user_id", "employee_id", "created_at");
