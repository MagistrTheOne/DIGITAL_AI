/**
 * Reports whether Better Auth / OAuth-related keys exist in .env (no values printed).
 */
const fs = require("fs");
const path = require("path");

const KEYS = [
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "NEXT_PUBLIC_BETTER_AUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
];

function parseEnvKeys(envPath) {
  const keys = new Set();
  if (!fs.existsSync(envPath)) return keys;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const k = trimmed.slice(0, eq).trim();
    if (k) keys.add(k);
  }
  return keys;
}

const envPath = path.join(__dirname, "..", ".env");
const present = parseEnvKeys(envPath);

console.log(".env auth-related keys (presence only):");
for (const k of KEYS) {
  const ok = present.has(k);
  console.log(`  ${k}: ${ok ? "set" : "missing"}`);
}

const googlePartial =
  present.has("GOOGLE_CLIENT_ID") !== present.has("GOOGLE_CLIENT_SECRET");
if (googlePartial) {
  console.log(
    "\nNote: Google OAuth needs both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or neither.",
  );
}
