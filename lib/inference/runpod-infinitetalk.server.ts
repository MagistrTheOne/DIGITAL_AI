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
  output?: { video_url?: string; cost?: number };
};

export async function runInfiniteTalkSync(input: {
  apiKey: string;
  prompt: string;
  imageUrl: string;
  audioUrl: string;
  size?: "480p" | "720p";
  enableSafetyChecker?: boolean;
}): Promise<
  | { ok: true; runpodId: string; videoUrl: string }
  | { ok: false; error: string }
> {
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
    return { ok: false, error: `RunPod returned non-JSON (HTTP ${res.status})` };
  }

  const st = typeof json.status === "string" ? json.status.toUpperCase() : "";
  if (st === "FAILED" || st === "CANCELLED") {
    const err =
            (typeof json.error === "string" && json.error) ||
            "InfiniteTalk generation failed";
    return { ok: false, error: err };
  }

  if (!res.ok) {
    const err =
      (typeof json.error === "string" && json.error) ||
      `InfiniteTalk HTTP ${res.status}`;
    return { ok: false, error: err };
  }

  const videoUrl =
    json.output &&
    typeof json.output.video_url === "string" &&
    /^https?:\/\//i.test(json.output.video_url)
      ? json.output.video_url
      : "";

  if (!videoUrl) {
    return {
      ok: false,
      error: "InfiniteTalk completed but no output.video_url",
    };
  }

  const runpodId =
    (typeof json.id === "string" && json.id) || `sync-${Date.now()}`;
  return { ok: true, runpodId, videoUrl };
}
