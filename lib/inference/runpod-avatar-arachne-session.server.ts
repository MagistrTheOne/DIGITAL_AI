import {
  enqueueRunPodV2Job,
  pollRunPodV2Job,
  type RunPodEnqueueResult,
  type RunPodPollStatus,
} from "@/lib/inference/runpod-v2.server";

function sessionT2vEndpointId(): string | null {
  const id = process.env.RUNPOD_ARACHNE_T2V_SESSION_ENDPOINT_ID?.trim();
  return id || null;
}

export function isRunPodArachneSessionT2vConfigured(): boolean {
  const apiKey = process.env.RUNPOD_API_KEY?.trim();
  return Boolean(apiKey && sessionT2vEndpointId());
}

export function getArachneSessionT2vRunPodConfig(): {
  apiKey: string;
  endpointId: string;
} | null {
  const apiKey = process.env.RUNPOD_API_KEY?.trim();
  const endpointId = sessionT2vEndpointId();
  if (!apiKey || !endpointId) return null;
  return { apiKey, endpointId };
}

export type ArachneSessionT2vInput = {
  positivePrompt: string;
  negativePrompt: string;
  promptTemplateVersion: number;
  height?: number;
  width?: number;
  numFrames?: number;
  numInferenceSteps?: number;
  textGuidanceScale?: number;
  sessionId: string;
  sequence: number;
  employeeId: string;
};

export async function enqueueArachneSessionT2vJob(
  input: ArachneSessionT2vInput,
): Promise<RunPodEnqueueResult> {
  const cfg = getArachneSessionT2vRunPodConfig();
  if (!cfg) {
    return { ok: false, error: "RunPod ARACHNE session T2V endpoint is not configured" };
  }

  return enqueueRunPodV2Job({
    apiKey: cfg.apiKey,
    endpointId: cfg.endpointId,
    bodyInput: {
      positive_prompt: input.positivePrompt,
      negative_prompt: input.negativePrompt,
      promptTemplateVersion: input.promptTemplateVersion,
      height: input.height ?? 512,
      width: input.width ?? 512,
      num_frames: input.numFrames ?? 16,
      num_inference_steps: input.numInferenceSteps ?? 25,
      text_guidance_scale: input.textGuidanceScale ?? 7.5,
      sessionId: input.sessionId,
      sequence: input.sequence,
      employeeId: input.employeeId,
    },
  });
}

export async function pollArachneSessionT2vJob(
  runpodJobId: string,
): Promise<RunPodPollStatus | null> {
  const cfg = getArachneSessionT2vRunPodConfig();
  if (!cfg) return null;
  return pollRunPodV2Job({
    apiKey: cfg.apiKey,
    endpointId: cfg.endpointId,
    runpodJobId,
  });
}
