"use server";

import { eq } from "drizzle-orm";

import { getCurrentSession } from "@/lib/auth/session.server";
import { db } from "@/services/db/client";
import { user } from "@/db/schema";

const MIN_LEN = 1;
const MAX_LEN = 120;

export async function updateAccountDisplayNameAction(
  rawName: string,
): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Unauthorized" };

  const name = rawName.trim().replace(/\s+/g, " ");
  if (name.length < MIN_LEN) {
    return { ok: false, error: "Display name cannot be empty." };
  }
  if (name.length > MAX_LEN) {
    return {
      ok: false,
      error: `Display name must be at most ${MAX_LEN} characters.`,
    };
  }

  try {
    await db
      .update(user)
      .set({ name, updatedAt: new Date() })
      .where(eq(user.id, userId));
    return { ok: true, name };
  } catch {
    return { ok: false, error: "Could not save display name." };
  }
}
