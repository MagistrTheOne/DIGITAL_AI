"use server";

import { eq } from "drizzle-orm";

import { getCurrentSession } from "@/lib/auth/session.server";
import { storeUserAvatar } from "@/lib/storage/avatar-storage";
import { db } from "@/services/db/client";
import { user } from "@/db/schema";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function uploadAvatarAction(
  formData: FormData,
): Promise<
  | { ok: true; imageUrl: string }
  | { ok: false; error: string }
> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Unauthorized" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file" };
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: "Use JPEG, PNG, or WebP." };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { ok: false, error: "Max file size is 2MB." };
  }

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const { url } = await storeUserAvatar(userId, buf, file.type);

    await db
      .update(user)
      .set({
        image: url,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    return { ok: true, imageUrl: url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return { ok: false, error: msg };
  }
}

export async function removeAvatarAction(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Unauthorized" };

  try {
    await db
      .update(user)
      .set({
        image: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    return { ok: true };
  } catch {
    return { ok: false, error: "Could not remove avatar." };
  }
}
