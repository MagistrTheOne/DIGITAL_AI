"use server";

import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { APIError } from "better-auth/api";

import { auth } from "@/lib/auth";
import {
  generateUserApiKeySecret,
  hashUserApiKeySecret,
  prefixFromUserApiKeySecret,
} from "@/lib/auth/api-key.server";
import { getCurrentSession } from "@/lib/auth/session.server";
import { db } from "@/db";
import { session } from "@/db/schema";
import {
  insertUserApiKey,
  revokeUserApiKey,
} from "@/services/db/repositories/user-api-key.repository";

function apiErrorMessage(e: unknown): string {
  if (e instanceof APIError) return e.message || "Request failed";
  if (e instanceof Error) return e.message;
  return "Request failed";
}

export async function revokeOtherSessionsAction(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const s = await getCurrentSession();
  if (!s?.user?.id) return { ok: false, error: "Unauthorized" };

  try {
    await auth.api.revokeOtherSessions({ headers: await headers() });
  } catch (e) {
    return { ok: false, error: apiErrorMessage(e) };
  }

  revalidatePath("/settings");
  return { ok: true };
}

export async function revokeSessionByIdAction(
  sessionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await getCurrentSession();
  if (!s?.user?.id) return { ok: false, error: "Unauthorized" };
  if (sessionId === s.session.id) {
    return {
      ok: false,
      error: "Use Sign out to end this session.",
    };
  }

  const [row] = await db
    .select({ token: session.token })
    .from(session)
    .where(and(eq(session.id, sessionId), eq(session.userId, s.user.id)))
    .limit(1);

  if (!row) return { ok: false, error: "Session not found." };

  try {
    await auth.api.revokeSession({
      headers: await headers(),
      body: { token: row.token },
    });
  } catch (e) {
    return { ok: false, error: apiErrorMessage(e) };
  }

  revalidatePath("/settings");
  return { ok: true };
}

export async function createUserApiKeyAction(formData: FormData): Promise<
  | { ok: true; secret: string }
  | { ok: false; error: string }
> {
  const s = await getCurrentSession();
  if (!s?.user?.id) return { ok: false, error: "Unauthorized" };

  const nameRaw = formData.get("name");
  const name =
    typeof nameRaw === "string" && nameRaw.trim()
      ? nameRaw.trim().slice(0, 120)
      : null;

  const secret = generateUserApiKeySecret();
  const keyHash = hashUserApiKeySecret(secret);
  const prefix = prefixFromUserApiKeySecret(secret);
  const id = randomUUID();

  try {
    await insertUserApiKey({
      id,
      userId: s.user.id,
      keyHash,
      prefix,
      name,
    });
  } catch {
    return { ok: false, error: "Could not create API key." };
  }

  revalidatePath("/settings");
  return { ok: true, secret };
}

export async function revokeUserApiKeyAction(
  keyId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await getCurrentSession();
  if (!s?.user?.id) return { ok: false, error: "Unauthorized" };

  const ok = await revokeUserApiKey(keyId, s.user.id);
  if (!ok) return { ok: false, error: "Key not found." };

  revalidatePath("/settings");
  return { ok: true };
}
