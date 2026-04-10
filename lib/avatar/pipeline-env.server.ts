import { isRunPodArachneSessionT2vConfigured } from "@/lib/inference/runpod-avatar-arachne-session.server";
import { isRunPodTalkingHeadConfigured } from "@/lib/inference/runpod-avatar-talking-head.server";
import { isInfiniteTalkApiAvailable } from "@/lib/inference/runpod-infinitetalk.server";

/** True when at least one session avatar path is available (InfiniteTalk, custom Ditto worker, or session T2V). */
export function isAvatarRenderPipelineEnvEnabled(): boolean {
  return (
    isInfiniteTalkApiAvailable() ||
    isRunPodTalkingHeadConfigured() ||
    isRunPodArachneSessionT2vConfigured()
  );
}

export function avatarPipelineHybridEnhanceDefaultFromEnv(): boolean {
  return process.env.AVATAR_PIPELINE_HYBRID_ENHANCE_DEFAULT?.trim() === "1";
}
