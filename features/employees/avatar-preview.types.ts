export type RenderStatus = "idle" | "generating" | "ready" | "failed";

/** Post-deploy auto digital-human pipeline phase (OpenAI → ElevenLabs → InfiniteTalk). */
export type AvatarRenderStage = "face" | "voice" | "video";

export type PreviewResponse = { jobId: string } | { videoUrl: string };

export type JobStatusResponse = {
  status: RenderStatus;
  videoUrl?: string;
  error?: string;
};

export function isPreviewJobResponse(
  r: PreviewResponse,
): r is { jobId: string } {
  return "jobId" in r && typeof r.jobId === "string" && r.jobId.length > 0;
}

export function isPreviewVideoResponse(
  r: PreviewResponse,
): r is { videoUrl: string } {
  return "videoUrl" in r && typeof r.videoUrl === "string" && r.videoUrl.length > 0;
}
