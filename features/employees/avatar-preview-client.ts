import type {
  JobStatusResponse,
  PreviewResponse,
} from "@/features/employees/avatar-preview.types";
import {
  isPreviewJobResponse,
  isPreviewVideoResponse,
} from "@/features/employees/avatar-preview.types";

export type GenerateAvatarPreviewResult =
  | { ok: true; status: number; body: PreviewResponse }
  | { ok: false; status: number; error: string };

export async function generateAvatarPreview(
  employeeId: string,
  body?: { referenceImage?: string },
): Promise<GenerateAvatarPreviewResult> {
  const res = await fetch(
    `/api/employees/${encodeURIComponent(employeeId)}/avatar-preview`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    },
  );

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    const err =
      (typeof data.error === "string" && data.error) ||
      `Request failed (${res.status})`;
    return { ok: false, status: res.status, error: err };
  }

  const jobId = typeof data.jobId === "string" ? data.jobId : "";
  const videoUrl = typeof data.videoUrl === "string" ? data.videoUrl : "";
  if (jobId) {
    return { ok: true, status: res.status, body: { jobId } };
  }
  if (videoUrl) {
    return { ok: true, status: res.status, body: { videoUrl } };
  }

  return {
    ok: false,
    status: res.status,
    error: "Invalid preview response (missing jobId and videoUrl)",
  };
}

export async function getJobStatus(jobId: string): Promise<{
  ok: true;
  status: number;
  body: JobStatusResponse;
} | { ok: false; status: number; error: string }> {
  const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, {
    method: "GET",
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    const err =
      (typeof data.error === "string" && data.error) ||
      `Request failed (${res.status})`;
    return { ok: false, status: res.status, error: err };
  }

  const status =
    data.status === "idle" ||
    data.status === "generating" ||
    data.status === "ready" ||
    data.status === "failed"
      ? data.status
      : "idle";

  const body: JobStatusResponse = {
    status,
    ...(typeof data.videoUrl === "string" ? { videoUrl: data.videoUrl } : {}),
    ...(typeof data.error === "string" ? { error: data.error } : {}),
  };

  return { ok: true, status: res.status, body };
}

const POLL_INITIAL_MS = 1_000;
const POLL_MULTIPLIER = 1.8;
const POLL_MAX_MS = 30_000;
const POLL_MAX_WALL_MS = 18 * 60 * 1_000;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    if (!signal) return;
    const onAbort = () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export async function pollJobUntilTerminal(
  jobId: string,
  options?: {
    signal?: AbortSignal;
    onTick?: (body: JobStatusResponse) => void;
  },
): Promise<JobStatusResponse> {
  const signal = options?.signal;
  let delay = POLL_INITIAL_MS;
  const started = Date.now();

  for (;;) {
    if (signal?.aborted) {
      return { status: "failed", error: "Cancelled" };
    }
    if (Date.now() - started > POLL_MAX_WALL_MS) {
      return { status: "failed", error: "Generation timed out. Try again later." };
    }

    const r = await getJobStatus(jobId);
    if (!r.ok) {
      return { status: "failed", error: r.error };
    }

    options?.onTick?.(r.body);

    if (r.body.status === "ready" || r.body.status === "failed") {
      return r.body;
    }

    try {
      await sleep(delay, signal);
    } catch {
      return { status: "failed", error: "Cancelled" };
    }
    delay = Math.min(Math.round(delay * POLL_MULTIPLIER), POLL_MAX_MS);
  }
}

export { isPreviewJobResponse, isPreviewVideoResponse };
