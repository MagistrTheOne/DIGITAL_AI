-- Optional organization name at registration (Better Auth `user.organization`).
-- Apply: psql "$DATABASE_URL" -f drizzle/0007_user_organization.sql

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "organization" text;
