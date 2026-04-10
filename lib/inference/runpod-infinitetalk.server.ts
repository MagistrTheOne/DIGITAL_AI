/**
 * RunPod Hub public model — audio-driven talking video (runsync).
 * @see https://docs.runpod.io/public-endpoints/models/infinitetalk
 * REST overview: https://docs.runpod.io/api-reference/overview
 */

const INFINITETALK_RUNSYNC =
  "https://api.runpod.ai/v2/infinitetalk/runsync";

export function isInfiniteTalkApiAvailable(): boolean {
  return Boolean(process.env.RUNPOD_API_KEY?.trim());
}

type RunSyncResponse = {
  id?: string;
  status?: string;
  error?: string;
  output?: unknown;
};

/** Hub docs use output.video_url; RunPod Hub also returns output.result (CloudFront mp4). */
function extractInfiniteTalkVideoUrl(output: unknown): string | null {
  if (!output) return null;
  if (typeof output === "string" && /^https:\/\//i.test(output.trim())) {
    return output.trim();
  }
  if (typeof output !== "object" || output === null) return null;
  const o = output as Record<string, unknown>;
  for (const k of ["video_url", "result", "videoUrl", "video", "url"] as const) {
    const v = o[k];
    if (typeof v === "string" && /^https:\/\//i.test(v.trim())) return v.trim();
  }
  const inner = o.output;
  if (inner && typeof inner === "object") {
    return extractInfiniteTalkVideoUrl(inner);
  }
  return null;
}

/** RunPod workers must fetch image + audio over the public internet. */
export function runPodMediaUrlIssue(url: string): string | null {
  const t = url.trim();
  if (!t) return "URL is empty.";
  if (!/^https:\/\//i.test(t)) {
    return "Image and audio must be absolute https:// URLs. Relative paths (e.g. /avatar-sessions/...) are invisible to RunPod — set BLOB_READ_WRITE_TOKEN so TTS audio is uploaded to public Blob storage.";
  }
  try {
    const u = new URL(t);
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1" || h === "::1") {
      return "localhost URLs are not reachable by RunPod. Use public HTTPS storage (BLOB_READ_WRITE_TOKEN) for session audio.";
    }
  } catch {
    return "Invalid media URL.";
  }
  return null;
}

export async function runInfiniteTalkSync(input: {
  apiKey: string;
  prompt: string;
  imageUrl: string;
  audioUrl: string;
  size?: "480p" | "720p";
  enableSafetyChecker?: boolean;
}): Promise<
  | { ok: true; runpodId: string; videoUrl: string }
  | { ok: false; error: string; kind?: "validation" | "provider" }
> {
  const imgIssue = runPodMediaUrlIssue(input.imageUrl);
  if (imgIssue) return { ok: false, error: imgIssue, kind: "validation" };
  const audIssue = runPodMediaUrlIssue(input.audioUrl);
  if (audIssue) return { ok: false, error: audIssue, kind: "validation" };

  const res = await fetch(INFINITETALK_RUNSYNC, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        prompt: input.prompt,
        image: input.imageUrl,
        audio: input.audioUrl,
        size: input.size ?? "480p",
        enable_safety_checker: input.enableSafetyChecker ?? true,
      },
    }),
    signal: AbortSignal.timeout(180_000),
  });

  const text = await res.text();
  let json: RunSyncResponse = {};
  try {
    json = text ? (JSON.parse(text) as RunSyncResponse) : {};
  } catch {
    return {
      ok: false,
      error: `RunPod returned non-JSON (HTTP ${res.status})`,
      kind: "provider",
    };
  }

  const st = typeof json.status === "string" ? json.status.toUpperCase() : "";
  if (st === "FAILED" || st === "CANCELLED") {
    const err =
            (typeof json.error === "string" && json.error) ||
            "InfiniteTalk generation failed";
    return { ok: false, error: err, kind: "provider" };
  }

  if (!res.ok) {
    const err =
      (typeof json.error === "string" && json.error) ||
      `InfiniteTalk HTTP ${res.status}`;
    return { ok: false, error: err, kind: "provider" };
  }

  const videoUrl =
    extractInfiniteTalkVideoUrl(json.output) ??
    extractInfiniteTalkVideoUrl(json);

  if (!videoUrl) {
    const snippet = JSON.stringify(json.output ?? json)
      .replace(/\s+/g, " ")
      .slice(0, 320);
    console.error("[InfiniteTalk] COMPLETED without video URL. Body snippet:", snippet);
    return {
      ok: false,
      kind: "provider",
      error:
        "InfiniteTalk finished but returned no usable video URL (expected output.video_url or output.result). " +
        "Use public https:// URLs for image and audio (BLOB_READ_WRITE_TOKEN for TTS audio). Check server logs for the RunPod response snippet.",
    };
  }

  const runpodId =
    (typeof json.id === "string" && json.id) || `sync-${Date.now()}`;
  return { ok: true, runpodId, videoUrl };
}
