import { pollArachneSessionT2vJob } from "@/lib/inference/runpod-avatar-arachne-session.server";
import { pollTalkingHeadJob } from "@/lib/inference/runpod-avatar-talking-head.server";
import type { RunpodEndpointKey } from "@/services/db/repositories/avatar-render-jobs.repository";
import {
  findAvatarRenderJobByIdForUser,
  updateAvatarRenderJob,
  type AvatarRenderJobRow,
} from "@/services/db/repositories/avatar-render-jobs.repository";

async function pollByEndpointKey(
  key: string | null,
  runpodJobId: string | null,
) {
  if (!runpodJobId) return null;
  if (key === "talking_head") return pollTalkingHeadJob(runpodJobId);
  if (key === "arachne_t2v") return pollArachneSessionT2vJob(runpodJobId);
  return null;
}

/**
 * Poll RunPod when job row is still in-flight; persist ready/failed/progress.
 */
export async function syncAvatarRenderJobRow(
  row: AvatarRenderJobRow,
  userId: string,
): Promise<AvatarRenderJobRow> {
  if (row.status === "ready" || row.status === "failed") return row;

  /** Public runsync jobs are persisted at enqueue time; nothing to poll. */
  if (row.runpodEndpointKey === "infinitetalk") {
    return row;
  }

  const polled = await pollByEndpointKey(
    row.runpodEndpointKey,
    row.runpodJobId,
  );
  if (!polled) return row;

  if (polled.kind === "failed") {
    await updateAvatarRenderJob({
      jobId: row.id,
      userId,
      patch: {
        status: "failed",
        error: polled.error,
        progress: 0,
      },
    });
  } else if (polled.kind === "ready") {
    await updateAvatarRenderJob({
      jobId: row.id,
      userId,
      patch: {
        status: "ready",
        videoUrl: polled.videoUrl,
        engineUsed: row.engineRequested,
        progress: 100,
        error: null,
      },
    });
  } else if (polled.kind === "queued") {
    await updateAvatarRenderJob({
      jobId: row.id,
      userId,
      patch: { status: "queued", progress: 0 },
    });
  } else {
    await updateAvatarRenderJob({
      jobId: row.id,
      userId,
      patch: {
        status: "processing",
        progress: polled.progress ?? row.progress,
      },
    });
  }

  const next = await findAvatarRenderJobByIdForUser(row.id, userId);
  return next ?? row;
}

export function isKnownRunpodEndpointKey(
  v: string | null,
): v is RunpodEndpointKey {
  return v === "infinitetalk" || v === "talking_head" || v === "arachne_t2v";
}
