import { randomUUID } from "node:crypto";

import { and, count, eq, inArray } from "drizzle-orm";

import { db } from "@/services/db/client";
import { avatarRenderJob } from "@/db/schema";

export type RunpodEndpointKey = "infinitetalk" | "talking_head" | "arachne_t2v";

export type AvatarRenderJobRow = typeof avatarRenderJob.$inferSelect;

export async function findAvatarRenderJobByIdForUser(
  jobId: string,
  userId: string,
): Promise<AvatarRenderJobRow | null> {
  const [row] = await db
    .select()
    .from(avatarRenderJob)
    .where(
      and(eq(avatarRenderJob.id, jobId), eq(avatarRenderJob.userId, userId)),
    )
    .limit(1);
  return row ?? null;
}

export async function findAvatarRenderJobBySessionSequenceTier(input: {
  userId: string;
  sessionId: string;
  sequence: number;
  videoTier: string;
}): Promise<AvatarRenderJobRow | null> {
  const [row] = await db
    .select()
    .from(avatarRenderJob)
    .where(
      and(
        eq(avatarRenderJob.userId, input.userId),
        eq(avatarRenderJob.sessionId, input.sessionId),
        eq(avatarRenderJob.sequence, input.sequence),
        eq(avatarRenderJob.videoTier, input.videoTier),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function countInFlightAvatarJobsForSession(input: {
  userId: string;
  sessionId: string;
}): Promise<number> {
  const [row] = await db
    .select({ c: count() })
    .from(avatarRenderJob)
    .where(
      and(
        eq(avatarRenderJob.userId, input.userId),
        eq(avatarRenderJob.sessionId, input.sessionId),
        inArray(avatarRenderJob.status, ["queued", "processing"]),
      ),
    );
  return Number(row?.c ?? 0);
}

export async function insertAvatarRenderJob(input: {
  userId: string;
  employeeId: string;
  sessionId: string;
  sequence: number;
  engineRequested: string;
  videoTier: string;
  parentJobId?: string | null;
  runpodEndpointKey: RunpodEndpointKey;
  runpodJobId: string;
  /** When set (e.g. InfiniteTalk runsync + blob persist), row is created already terminal. */
  initial?: {
    status?: string;
    progress?: number;
    videoUrl?: string | null;
    engineUsed?: string | null;
  };
}): Promise<AvatarRenderJobRow> {
  const id = randomUUID();
  const now = new Date();
  const initial = input.initial;
  const [row] = await db
    .insert(avatarRenderJob)
    .values({
      id,
      userId: input.userId,
      employeeId: input.employeeId,
      sessionId: input.sessionId,
      sequence: input.sequence,
      engineRequested: input.engineRequested,
      videoTier: input.videoTier,
      parentJobId: input.parentJobId ?? null,
      status: initial?.status ?? "processing",
      progress: initial?.progress ?? 0,
      videoUrl: initial?.videoUrl ?? null,
      engineUsed: initial?.engineUsed ?? null,
      runpodJobId: input.runpodJobId,
      runpodEndpointKey: input.runpodEndpointKey,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!row) throw new Error("insertAvatarRenderJob failed");
  return row;
}

export async function updateAvatarRenderJob(input: {
  jobId: string;
  userId: string;
  patch: Partial<{
    status: string;
    progress: number;
    videoUrl: string | null;
    error: string | null;
    engineUsed: string | null;
    runpodJobId: string | null;
  }>;
}): Promise<boolean> {
  const patch = { ...input.patch, updatedAt: new Date() };
  const updated = await db
    .update(avatarRenderJob)
    .set(patch)
    .where(
      and(
        eq(avatarRenderJob.id, input.jobId),
        eq(avatarRenderJob.userId, input.userId),
      ),
    )
    .returning({ id: avatarRenderJob.id });
  return updated.length > 0;
}
