import {
  enqueueRunPodV2Job,
  pollRunPodV2Job,
  type RunPodEnqueueResult,
  type RunPodPollStatus,
} from "@/lib/inference/runpod-v2.server";

function talkingHeadEndpointId(): string | null {
  const id =
    process.env.RUNPOD_AVATAR_TALKING_HEAD_ENDPOINT_ID?.trim() ||
    process.env.RUNPOD_TALKING_HEAD_ENDPOINT_ID?.trim();
  return id || null;
}

export function isRunPodTalkingHeadConfigured(): boolean {
  const apiKey = process.env.RUNPOD_API_KEY?.trim();
  return Boolean(apiKey && talkingHeadEndpointId());
}

export function getTalkingHeadRunPodConfig(): {
  apiKey: string;
  endpointId: string;
} | null {
  const apiKey = process.env.RUNPOD_API_KEY?.trim();
  const endpointId = talkingHeadEndpointId();
  if (!apiKey || !endpointId) return null;
  return { apiKey, endpointId };
}

export async function enqueueTalkingHeadAvatarJob(input: {
  audioUrl: string;
  imageUrl: string;
  sessionId: string;
  sequence: number;
  employeeId: string;
}): Promise<RunPodEnqueueResult> {
  const cfg = getTalkingHeadRunPodConfig();
  if (!cfg) return { ok: false, error: "RunPod talking-head endpoint is not configured" };

  return enqueueRunPodV2Job({
    apiKey: cfg.apiKey,
    endpointId: cfg.endpointId,
    bodyInput: {
      audioUrl: input.audioUrl,
      imageUrl: input.imageUrl,
      sessionId: input.sessionId,
      sequence: input.sequence,
      employeeId: input.employeeId,
    },
  });
}

export async function pollTalkingHeadJob(
  runpodJobId: string,
): Promise<RunPodPollStatus | null> {
  const cfg = getTalkingHeadRunPodConfig();
  if (!cfg) return null;
  return pollRunPodV2Job({
    apiKey: cfg.apiKey,
    endpointId: cfg.endpointId,
    runpodJobId,
  });
}
