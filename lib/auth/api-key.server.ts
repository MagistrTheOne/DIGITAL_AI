import { createHash, randomBytes } from "node:crypto";

import {
  findActiveApiKeyByHash,
  touchUserApiKeyLastUsed,
} from "@/services/db/repositories/user-api-key.repository";

const LAST_USED_TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export function hashUserApiKeySecret(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

/** Random secret; shown once to the user. Prefix is `sk_live_`. */
export function generateUserApiKeySecret(): string {
  const suffix = randomBytes(24).toString("base64url");
  return `sk_live_${suffix}`;
}

export function prefixFromUserApiKeySecret(secret: string): string {
  if (secret.length <= 18) return `${secret}…`;
  return `${secret.slice(0, 18)}…`;
}

/**
 * Validates `Authorization: Bearer <sk_live_…>` against stored SHA-256 hashes.
 */
export async function verifyUserApiKeyFromRequest(
  request: Request,
): Promise<{ userId: string } | null> {
  const authz = request.headers.get("authorization");
  const m = authz?.match(/^Bearer\s+(\S+)/i);
  const token = m?.[1]?.trim();
  if (!token) return null;

  const keyHash = hashUserApiKeySecret(token);
  const row = await findActiveApiKeyByHash(keyHash);
  if (!row) return null;

  const now = Date.now();
  const last = row.lastUsedAt?.getTime() ?? 0;
  if (now - last > LAST_USED_TOUCH_INTERVAL_MS) {
    await touchUserApiKeyLastUsed(row.id);
  }

  return { userId: row.userId };
}
