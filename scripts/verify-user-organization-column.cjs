/** Confirms public.user.organization exists (read-only). */
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
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  const sql = postgres(url, { max: 1 });
  try {
    const rows = await sql`
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'user'
        and column_name = 'organization'
    `;
    if (rows.length === 0) {
      console.error('Column "organization" not found on public."user".');
      process.exit(1);
    }
    console.log('OK: public."user"."organization" exists.');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
