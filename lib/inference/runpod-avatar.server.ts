import {
  buildEmployeeAvatarPromptContext,
  buildEmployeeAvatarPrompts,
} from "@/lib/inference/build-employee-avatar-prompt.server";
import type { JobStatusResponse } from "@/features/employees/avatar-preview.types";
import {
  getEmployeeRowById,
  updateEmployeeAvatarPreviewState,
  updateEmployeeRow,
  type EmployeeConfigJson,
} from "@/services/db/repositories/employees.repository";

function getRunPodConfig(): { apiKey: string; endpointId: string } | null {
  const apiKey = process.env.RUNPOD_API_KEY?.trim();
  const endpointId = process.env.RUNPOD_AVATAR_ENDPOINT_ID?.trim();
  if (!apiKey || !endpointId) return null;
  return { apiKey, endpointId };
}

/** True when post-deploy avatar enqueue should use RunPod (takes precedence over ARACHNE). */
export function isRunPodAvatarConfigured(): boolean {
  return getRunPodConfig() !== null;
}

function extractVideoUrlFromRunPodOutput(output: unknown): string | null {
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

/**
 * After an employee is finalized (active), enqueue RunPod serverless job if env is configured.
 * Persists generating + jobId on success, or failed on immediate error.
 */
export async function enqueueRunPodAvatarJobIfConfigured(input: {
  employeeId: string;
  userId: string;
}): Promise<void> {
  const cfgRunpod = getRunPodConfig();
  if (!cfgRunpod) return;

  const row = await getEmployeeRowById(input.employeeId, input.userId);
  if (!row) return;

  const prev = (row.config ?? {}) as EmployeeConfigJson;
  if (
    prev.avatarRenderStatus === "generating" &&
    typeof prev.avatarPreviewJobId === "string" &&
    prev.avatarPreviewJobId.length > 0
  ) {
    return;
  }

  const ctx = buildEmployeeAvatarPromptContext({
    name: row.name,
    roleColumn: row.role,
    config: prev,
  });
  const { positivePrompt, negativePrompt, promptTemplateVersion } =
    buildEmployeeAvatarPrompts(ctx);

  const url = `https://api.runpod.ai/v2/${cfgRunpod.endpointId}/run`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfgRunpod.apiKey}`,
      },
      body: JSON.stringify({
        input: {
          positivePrompt,
          negativePrompt,
          promptTemplateVersion,
          employeeId: input.employeeId,
        },
      }),
      signal: AbortSignal.timeout(60_000),
    });

    const text = await res.text();
    let json: unknown = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      await updateEmployeeAvatarPreviewState(input.employeeId, input.userId, {
        avatarRenderStatus: "failed",
        avatarPreviewError: `RunPod returned non-JSON (HTTP ${res.status})`,
        avatarPreviewJobId: null,
      });
      return;
    }

    if (!res.ok) {
      const msg =
        typeof json === "object" &&
        json !== null &&
        "error" in json &&
        typeof (json as { error: unknown }).error === "string"
          ? (json as { error: string }).error
          : `RunPod enqueue failed (${res.status})`;
      await updateEmployeeAvatarPreviewState(input.employeeId, input.userId, {
        avatarRenderStatus: "failed",
        avatarPreviewError: msg,
        avatarPreviewJobId: null,
      });
      return;
    }

    const o = json as Record<string, unknown>;
    const jobId =
      (typeof o.id === "string" && o.id) ||
      (typeof o.jobId === "string" && o.jobId) ||
      "";

    if (!jobId) {
      await updateEmployeeAvatarPreviewState(input.employeeId, input.userId, {
        avatarRenderStatus: "failed",
        avatarPreviewError: "RunPod response missing job id",
        avatarPreviewJobId: null,
      });
      return;
    }

    const nextConfig: EmployeeConfigJson = {
      ...prev,
      avatarRenderStatus: "generating",
      avatarPreviewJobId: jobId,
      avatarPreviewError: null,
      avatarGenerationRequestedAt: new Date().toISOString(),
      promptTemplateVersion,
    };
    await updateEmployeeRow({
      employeeId: input.employeeId,
      userId: input.userId,
      config: nextConfig,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "RunPod request failed";
    await updateEmployeeAvatarPreviewState(input.employeeId, input.userId, {
      avatarRenderStatus: "failed",
      avatarPreviewError: msg,
      avatarPreviewJobId: null,
    });
  }
}

/** Poll RunPod job status; map to JobStatusResponse. */
export async function fetchRunPodJobStatus(jobId: string): Promise<{
  ok: true;
  body: JobStatusResponse;
  videoUrl?: string;
} | { ok: false }> {
  const cfgRunpod = getRunPodConfig();
  if (!cfgRunpod) return { ok: false };

  const url = `https://api.runpod.ai/v2/${cfgRunpod.endpointId}/status/${jobId}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${cfgRunpod.apiKey}` },
      signal: AbortSignal.timeout(45_000),
    });
    const text = await res.text();
    let json: unknown = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      return { ok: false };
    }
    const o = json as Record<string, unknown>;
    const status = typeof o.status === "string" ? o.status.toUpperCase() : "";

    if (status === "FAILED" || status === "CANCELLED") {
      const err =
        (typeof o.error === "string" && o.error) ||
        (typeof o.message === "string" && o.message) ||
        "RunPod job failed";
      return { ok: true, body: { status: "failed", error: err } };
    }

    if (status === "COMPLETED" || status === "SUCCESS") {
      const videoUrl = extractVideoUrlFromRunPodOutput(o.output ?? o);
      if (videoUrl) {
        return {
          ok: true,
          body: { status: "ready", videoUrl },
          videoUrl,
        };
      }
      return {
        ok: true,
        body: {
          status: "failed",
          error: "RunPod completed but no video URL in output",
        },
      };
    }

    return { ok: true, body: { status: "generating" } };
  } catch {
    return { ok: false };
  }
}
