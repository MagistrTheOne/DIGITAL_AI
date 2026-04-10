import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/services/db/client";
import { userApiKey } from "@/db/schema";

export type UserApiKeyRow = typeof userApiKey.$inferSelect;

export async function listActiveApiKeysForUser(
  userId: string,
): Promise<UserApiKeyRow[]> {
  return db
    .select()
    .from(userApiKey)
    .where(
      and(eq(userApiKey.userId, userId), isNull(userApiKey.revokedAt)),
    )
    .orderBy(desc(userApiKey.createdAt));
}

export async function insertUserApiKey(input: {
  id: string;
  userId: string;
  keyHash: string;
  prefix: string;
  name: string | null;
}): Promise<void> {
  await db.insert(userApiKey).values({
    id: input.id,
    userId: input.userId,
    keyHash: input.keyHash,
    prefix: input.prefix,
    name: input.name,
  });
}

export async function revokeUserApiKey(
  keyId: string,
  userId: string,
): Promise<boolean> {
  const res = await db
    .update(userApiKey)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(userApiKey.id, keyId),
        eq(userApiKey.userId, userId),
        isNull(userApiKey.revokedAt),
      ),
    )
    .returning({ id: userApiKey.id });
  return res.length > 0;
}

export async function findActiveApiKeyByHash(
  keyHash: string,
): Promise<{ id: string; userId: string; lastUsedAt: Date | null } | null> {
  const [row] = await db
    .select({
      id: userApiKey.id,
      userId: userApiKey.userId,
      lastUsedAt: userApiKey.lastUsedAt,
    })
    .from(userApiKey)
    .where(and(eq(userApiKey.keyHash, keyHash), isNull(userApiKey.revokedAt)))
    .limit(1);
  return row ?? null;
}

export async function touchUserApiKeyLastUsed(keyId: string): Promise<void> {
  await db
    .update(userApiKey)
    .set({ lastUsedAt: new Date() })
    .where(eq(userApiKey.id, keyId));
}
