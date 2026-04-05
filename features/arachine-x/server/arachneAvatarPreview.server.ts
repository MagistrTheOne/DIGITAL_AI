/**
 * Optional ARACHNE-X (or worker) hook for talking-head / avatar preview video.
 * Inference runs on the ARACHNE / GPU side, not in Next.
 */

export type ArachneAvatarPreviewInput = {
  employeeId: string;
  displayName?: string;
  /** Employee system / behavior prompt from config — sent as hint for generation. */
  promptHint?: string;
  /** Optional reference still (data URL or https URL) for image-conditioned modes. */
  referenceImage?: string;
};

export type ArachneAvatarPreviewResult =
  | { ok: true; mode: "sync"; videoUrl: string }
  | { ok: true; mode: "async"; jobId: string }
  | { ok: false; error: string; status?: number };

function getServiceKeyHeader(): Record<string, string> {
  const key = process.env.NULLXES_REALTIME_SERVICE_KEY?.trim();
  return key ? { "X-NULLXES-Realtime-Service-Key": key } : {};
}

/**
 * POST to `ARACHNE_AVATAR_PREVIEW_URL`. Response JSON may include:
 * - Async: `jobId` (starts job; poll separately)
 * - Sync: `videoUrl` | `previewUrl` | `url` (absolute https URL to mp4/webm)
 */
export async function requestArachneAvatarPreview(
  input: ArachneAvatarPreviewInput,
): Promise<ArachneAvatarPreviewResult> {
  const endpoint = process.env.ARACHNE_AVATAR_PREVIEW_URL?.trim();
  if (!endpoint) {
    return {
      ok: false,
      error:
        "ARACHNE_AVATAR_PREVIEW_URL is not set. Add it when the ARACHNE worker exposes a preview endpoint.",
    };
  }

  const body: Record<string, string | undefined> = {
    employeeId: input.employeeId,
    displayName: input.displayName,
    promptHint: input.promptHint,
    referenceImage: input.referenceImage,
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getServiceKeyHeader(),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180_000),
    });

    const text = await res.text();
    let json: unknown;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      if (res.status === 404) {
        return {
          ok: false,
          error:
            "ARACHNE returned 404 for ARACHNE_AVATAR_PREVIEW_URL — wrong path or preview API not deployed yet (LongCat worker must expose this route).",
          status: res.status,
        };
      }
      return {
        ok: false,
        error: `ARACHNE preview response was not JSON (HTTP ${res.status}).`,
        status: res.status,
      };
    }

    if (!res.ok) {
      const msg =
        typeof json === "object" &&
        json !== null &&
        "message" in json &&
        typeof (json as { message: unknown }).message === "string"
          ? (json as { message: string }).message
          : `Avatar preview failed (${res.status})`;
      if (res.status === 404) {
        return {
          ok: false,
          error: `${msg} — fix ARACHNE_AVATAR_PREVIEW_URL to match your OpenAPI / D_SAAS contract.`,
          status: res.status,
        };
      }
      return { ok: false, error: msg, status: res.status };
    }

    if (typeof json !== "object" || json === null) {
      return { ok: false, error: "Empty preview response", status: res.status };
    }

    const o = json as Record<string, unknown>;
    const jobIdRaw = o.jobId;
    if (typeof jobIdRaw === "string" && jobIdRaw.trim().length > 0) {
      return { ok: true, mode: "async", jobId: jobIdRaw.trim() };
    }

    const videoUrl =
      (typeof o.videoUrl === "string" && o.videoUrl) ||
      (typeof o.previewUrl === "string" && o.previewUrl) ||
      (typeof o.url === "string" && o.url) ||
      "";

    if (!videoUrl.startsWith("https://") && !videoUrl.startsWith("http://")) {
      return {
        ok: false,
        error:
          "Preview response must include jobId or videoUrl / previewUrl / url with an http(s) URL",
        status: res.status,
      };
    }

    return { ok: true, mode: "sync", videoUrl };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Network error calling avatar preview";
    return { ok: false, error: message };
  }
}
