/**
 * Multi-engine avatar video execution layer (Ditto / ARACHNE-X T2V / in-worker fallbacks).
 * Safe to import from client for types only.
 */

export type AvatarEngine =
  | "infinitetalk"
  | "ditto"
  | "sadtalker"
  | "arachne_t2v";

export type AvatarVideoTier = "realtime" | "enhanced";

export type AvatarRenderJobStatus =
  | "queued"
  | "processing"
  | "ready"
  | "failed";

export type AvatarRenderRequestBody = {
  sessionId: string;
  sequence: number;
  audioUrl?: string;
  imageUrl?: string;
  text?: string;
  engine?: AvatarEngine;
  hybridEnhance?: boolean;
  employeeId?: string;
};

export type AvatarRenderEnqueueResponse = {
  jobs: Array<{
    jobId: string;
    videoTier: AvatarVideoTier;
    engine: AvatarEngine;
    status: AvatarRenderJobStatus;
  }>;
};

export type AvatarRenderStatusResponse = {
  status: AvatarRenderJobStatus;
  videoUrl?: string | null;
  progress: number;
  engine: AvatarEngine;
  videoTier: AvatarVideoTier;
  parentJobId: string | null;
  error?: string | null;
  runpodJobId?: string | null;
};

export function normalizeAvatarEngine(
  v: string | undefined,
): AvatarEngine | undefined {
  if (
    v === "infinitetalk" ||
    v === "ditto" ||
    v === "sadtalker" ||
    v === "arachne_t2v"
  ) {
    return v;
  }
  return undefined;
}
