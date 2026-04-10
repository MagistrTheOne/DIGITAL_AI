import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { put } from "@vercel/blob";

const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

/**
 * Download a RunPod / vendor video URL and persist to durable storage (never rely on 7-day URLs).
 */
export async function persistRemoteAvatarVideoMp4(input: {
  userId: string;
  sourceUrl: string;
  filenamePrefix?: string;
}): Promise<{ url: string }> {
  const res = await fetch(input.sourceUrl, {
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) {
    throw new Error(`Could not download generated video (HTTP ${res.status})`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_VIDEO_BYTES) {
    throw new Error("Generated video exceeds storage limit");
  }

  const prefix = input.filenamePrefix?.replace(/[^a-zA-Z0-9_-]/g, "") || "clip";
  const filename = `${input.userId}/${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}.mp4`;

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (token) {
    const blob = await put(`avatar-clips/${filename}`, buf, {
      access: "public",
      token,
      contentType: "video/mp4",
      addRandomSuffix: false,
    });
    return { url: blob.url };
  }

  if (process.env.NODE_ENV === "development") {
    const dir = path.join(process.cwd(), "public", "avatar-clips", input.userId);
    await mkdir(dir, { recursive: true });
    const base = `${prefix}-${Date.now()}.mp4`;
    const filePath = path.join(dir, base);
    await writeFile(filePath, buf);
    return { url: `/avatar-clips/${input.userId}/${base}` };
  }

  throw new Error(
    "Video persistence is not configured. Set BLOB_READ_WRITE_TOKEN (Vercel Blob) in production.",
  );
}
