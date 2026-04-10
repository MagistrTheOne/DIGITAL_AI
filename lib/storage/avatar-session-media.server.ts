import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { put } from "@vercel/blob";

const MAX_SEGMENT_AUDIO_BYTES = 6 * 1024 * 1024;

/**
 * Public URL for short TTS / segment audio so RunPod workers can fetch it.
 */
export async function storeAvatarSessionAudioMp3(
  userId: string,
  buffer: Buffer,
): Promise<{ url: string }> {
  if (buffer.length > MAX_SEGMENT_AUDIO_BYTES) {
    throw new Error("Audio segment too large");
  }

  const filename = `${userId}/${Date.now()}-${Math.random().toString(16).slice(2)}.mp3`;

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (token) {
    const blob = await put(`avatar-sessions/${filename}`, buffer, {
      access: "public",
      token,
      contentType: "audio/mpeg",
      addRandomSuffix: false,
    });
    return { url: blob.url };
  }

  if (process.env.NODE_ENV === "development") {
    const dir = path.join(process.cwd(), "public", "avatar-sessions", userId);
    await mkdir(dir, { recursive: true });
    const base = `${Date.now()}-${Math.random().toString(16).slice(2)}.mp3`;
    const filePath = path.join(dir, base);
    await writeFile(filePath, buffer);
    return { url: `/avatar-sessions/${userId}/${base}` };
  }

  throw new Error(
    "Segment audio storage is not configured. Set BLOB_READ_WRITE_TOKEN (Vercel Blob) in production.",
  );
}
