/**
 * Ensures pgvector is available before drizzle-kit push/introspect.
 * Run: node scripts/ensure-pgvector.cjs
 * Neon: enable once per database; idempotent.
 */
const fs = require("fs");
const path = require("path");
const postgres = require("postgres");

function loadDatabaseUrlFromEnvFile() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return null;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^DATABASE_URL=(.*)$/);
    if (m) {
      let v = m[1].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      return v;
    }
  }
  return null;
}

async function main() {
  const url = process.env.DATABASE_URL || loadDatabaseUrlFromEnvFile();
  if (!url) {
    console.error(
      "[ensure-pgvector] DATABASE_URL not set and not found in .env",
    );
    process.exit(1);
  }

  const sql = postgres(url, { max: 1 });
  try {
    await sql.unsafe("CREATE EXTENSION IF NOT EXISTS vector");
    console.log("[ensure-pgvector] CREATE EXTENSION vector — ok");
  } catch (e) {
    console.error(
      "[ensure-pgvector] Failed (Neon may need pgvector enabled on the project):",
      e instanceof Error ? e.message : e,
    );
    process.exit(1);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
