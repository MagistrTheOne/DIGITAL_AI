import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { put } from "@vercel/blob";

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

/**
 * Persists avatar bytes and returns a public URL.
 * - Production: Vercel Blob (`BLOB_READ_WRITE_TOKEN`).
 * - Local dev: `public/avatars/` when Blob token is unset (served as `/avatars/...`).
 */
export async function storeUserAvatar(
  userId: string,
  buffer: Buffer,
  contentType: string,
): Promise<{ url: string }> {
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error("File too large");
  }

  const ext =
    contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";

  const filename = `${userId}-${Date.now()}.${ext}`;

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (token) {
    const blob = await put(`avatars/${filename}`, buffer, {
      access: "public",
      token,
      contentType,
      addRandomSuffix: false,
    });
    return { url: blob.url };
  }

  if (process.env.NODE_ENV === "development") {
    const dir = path.join(process.cwd(), "public", "avatars");
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    await writeFile(filePath, buffer);
    return { url: `/avatars/${filename}` };
  }

  throw new Error(
    "Avatar storage is not configured. Set BLOB_READ_WRITE_TOKEN (Vercel Blob) in production.",
  );
}
