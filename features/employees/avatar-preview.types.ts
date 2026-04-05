export type RenderStatus = "idle" | "generating" | "ready" | "failed";

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
