/**
 * Appends BETTER_AUTH_SECRET to .env if missing or empty (32+ chars, base64).
 * Does not print the secret.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const envPath = path.join(__dirname, "..", ".env");

function hasNonEmptySecret(raw) {
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = t.match(/^BETTER_AUTH_SECRET=(.*)$/);
    if (m) {
      let v = m[1].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      return v.length >= 32;
    }
  }
  return false;
}

function main() {
  let raw = "";
  if (fs.existsSync(envPath)) {
    raw = fs.readFileSync(envPath, "utf8");
  }

  if (hasNonEmptySecret(raw)) {
    console.log("BETTER_AUTH_SECRET already set (>= 32 chars). No change.");
    return;
  }

  const secret = crypto.randomBytes(32).toString("base64");
  const nl = raw.endsWith("\n") || raw.length === 0 ? "" : "\n";
  const block = `${nl}# Added by scripts/ensure-better-auth-secret.cjs — see https://www.better-auth.com/docs/installation\nBETTER_AUTH_SECRET=${secret}\n`;

  fs.appendFileSync(envPath, block, "utf8");
  console.log("Appended BETTER_AUTH_SECRET to .env (value not shown).");
}

main();
