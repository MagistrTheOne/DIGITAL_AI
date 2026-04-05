/**
 * Applies drizzle/0007_user_organization.sql using DATABASE_URL from .env.
 * Same effect as: psql "$DATABASE_URL" -f drizzle/0007_user_organization.sql
 */
const fs = require("fs");
const path = require("path");
const postgres = require("postgres");

function loadDatabaseUrlFromEnvFile() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) {
    console.error("Missing .env at project root.");
    process.exit(1);
  }
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
    console.error("DATABASE_URL not set and not found in .env");
    process.exit(1);
  }

  const migrationPath = path.join(
    __dirname,
    "..",
    "drizzle",
    "0007_user_organization.sql",
  );
  const migration = fs.readFileSync(migrationPath, "utf8");

  const sql = postgres(url, { max: 1 });
  try {
    await sql.unsafe(migration);
    console.log("Applied drizzle/0007_user_organization.sql successfully.");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
