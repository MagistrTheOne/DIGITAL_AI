/**
 * RunPod serverless v2 API helpers (generic by endpoint id).
 * Preview avatar jobs keep using `runpod-avatar.server.ts` + RUNPOD_AVATAR_ENDPOINT_ID.
 */

export function extractVideoUrlFromRunPodOutput(output: unknown): string | null {
  if (output == null) return null;
  if (typeof output === "string" && /^https?:\/\//i.test(output)) return output;
  if (typeof output !== "object") return null;
  const o = output as Record<string, unknown>;
  for (const key of ["videoUrl", "url", "previewUrl", "output_video"]) {
    const v = o[key];
    if (typeof v === "string" && /^https?:\/\//i.test(v)) return v;
  }
  const nested = o.output ?? o.result;
  if (nested && typeof nested === "object") {
    return extractVideoUrlFromRunPodOutput(nested);
  }
  return null;
}

export type RunPodEnqueueResult =
  | { ok: true; runpodJobId: string }
  | { ok: false; error: string };

export async function enqueueRunPodV2Job(input: {
  apiKey: string;
  endpointId: string;
  bodyInput: Record<string, unknown>;
}): Promise<RunPodEnqueueResult> {
  const url = `https://api.runpod.ai/v2/${input.endpointId}/run`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({ input: input.bodyInput }),
      signal: AbortSignal.timeout(60_000),
    });
    const text = await res.text();
    let json: unknown = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      return { ok: false, error: `RunPod returned non-JSON (HTTP ${res.status})` };
    }
    if (!res.ok) {
      const msg =
        typeof json === "object" &&
        json !== null &&
        "error" in json &&
        typeof (json as { error: unknown }).error === "string"
          ? (json as { error: string }).error
          : `RunPod enqueue failed (${res.status})`;
      return { ok: false, error: msg };
    }
    const o = json as Record<string, unknown>;
    const runpodJobId =
      (typeof o.id === "string" && o.id) ||
      (typeof o.jobId === "string" && o.jobId) ||
      "";
    if (!runpodJobId) return { ok: false, error: "RunPod response missing job id" };
    return { ok: true, runpodJobId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "RunPod request failed",
    };
  }
}

export type RunPodPollStatus =
  | { kind: "queued" }
  | { kind: "processing"; progress?: number }
  | { kind: "ready"; videoUrl: string }
  | { kind: "failed"; error: string };

export async function pollRunPodV2Job(input: {
  apiKey: string;
  endpointId: string;
  runpodJobId: string;
}): Promise<RunPodPollStatus | null> {
  const url = `https://api.runpod.ai/v2/${input.endpointId}/status/${input.runpodJobId}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${input.apiKey}` },
      signal: AbortSignal.timeout(45_000),
    });
    const text = await res.text();
    let json: unknown = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      return null;
    }
    const o = json as Record<string, unknown>;
    const status = typeof o.status === "string" ? o.status.toUpperCase() : "";

    if (status === "FAILED" || status === "CANCELLED") {
      const err =
        (typeof o.error === "string" && o.error) ||
        (typeof o.message === "string" && o.message) ||
        "RunPod job failed";
      return { kind: "failed", error: err };
    }

    if (status === "COMPLETED" || status === "SUCCESS") {
      const videoUrl = extractVideoUrlFromRunPodOutput(o.output ?? o);
      if (videoUrl) return { kind: "ready", videoUrl };
      return {
        kind: "failed",
        error: "RunPod completed but no video URL in output",
      };
    }

    const prog =
      typeof o.progress === "number" && Number.isFinite(o.progress)
        ? Math.round(o.progress)
        : undefined;
    if (status === "IN_QUEUE") {
      return { kind: "queued" };
    }
    return { kind: "processing", progress: prog };
  } catch {
    return null;
  }
}
