/**
 * Recommended single call: POST {ARACHNE_HTTP_BASE}/v1/avatar/bootstrap
 * Falls back to legacy mint only when ARACHNE returns 404/405 (route not deployed).
 */

import type { ArachneRealtimeMintInput } from "@/features/arachine-x/server/arachneRealtimeMint.server";
import { mintArachneRealtimeToken } from "@/features/arachine-x/server/arachneRealtimeMint.server";

function arachneBase(): string | undefined {
  const raw = process.env.ARACHNE_HTTP_BASE?.trim();
  if (!raw) return undefined;
  return raw.replace(/\/+$/, "");
}

function serviceKeyHeaders(): Record<string, string> {
  const key = process.env.NULLXES_REALTIME_SERVICE_KEY?.trim();
  return key ? { "X-NULLXES-Realtime-Service-Key": key } : {};
}

export type ArachneAvatarBootstrapSuccess = {
  ok: true;
  token: string;
  websocketUrl: string;
  issuedAt: string;
  expiresAt: string;
  videoPreviewUrl: string | null;
  avatarPreviewStatus: string | null;
  pipelineMode: string | null;
  arachneOutputProfile: string | null;
  audioTransport: string | null;
  avatarPreviewCached: boolean;
};

export type ArachneAvatarBootstrapFailure = {
  ok: false;
  error: string;
  status?: number;
  /** Call /v1/realtime/token instead (bootstrap not on this pod). */
  fallbackToLegacyMint?: boolean;
};

export type ArachneAvatarBootstrapResult =
  | ArachneAvatarBootstrapSuccess
  | ArachneAvatarBootstrapFailure;

function pickString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t || null;
}

function pickBool(v: unknown): boolean {
  return v === true;
}

export async function mintArachneAvatarBootstrap(
  input: ArachneRealtimeMintInput,
): Promise<ArachneAvatarBootstrapResult> {
  const base = arachneBase();
  if (!base) {
    return {
      ok: false,
      error:
        "ARACHNE_HTTP_BASE is not set. Configure the ARACHNE HTTP origin for bootstrap.",
    };
  }

  const url = `${base}/v1/avatar/bootstrap`;
  const body: Record<string, string> = {
    sessionId: input.sessionId,
  };
  if (input.employeeId) body.employeeId = input.employeeId;
  if (input.nullxesSessionId) body.nullxesSessionId = input.nullxesSessionId;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...serviceKeyHeaders(),
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (res.status === 404 || res.status === 405) {
      return {
        ok: false,
        error: "ARACHNE avatar bootstrap route not available",
        status: res.status,
        fallbackToLegacyMint: true,
      };
    }

    let json: unknown;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      return {
        ok: false,
        error: `Invalid JSON from ARACHNE avatar bootstrap (${res.status})`,
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
          : `ARACHNE avatar bootstrap failed (${res.status})`;
      return { ok: false, error: msg, status: res.status };
    }

    if (typeof json !== "object" || json === null) {
      return {
        ok: false,
        error: "Invalid avatar bootstrap response shape",
        status: res.status,
      };
    }

    const o = json as Record<string, unknown>;
    const token = o.token;
    const websocketUrl = o.websocketUrl;
    const issuedAt = o.issuedAt;
    const expiresAt = o.expiresAt;

    if (
      typeof token !== "string" ||
      typeof websocketUrl !== "string" ||
      typeof issuedAt !== "string" ||
      typeof expiresAt !== "string"
    ) {
      return {
        ok: false,
        error:
          "Bootstrap response missing token, websocketUrl, issuedAt, or expiresAt",
        status: res.status,
      };
    }

    return {
      ok: true,
      token,
      websocketUrl,
      issuedAt,
      expiresAt,
      videoPreviewUrl: pickString(o.videoPreviewUrl),
      avatarPreviewStatus: pickString(o.avatarPreviewStatus),
      pipelineMode: pickString(o.pipelineMode),
      arachneOutputProfile: pickString(o.arachneOutputProfile),
      audioTransport: pickString(o.audioTransport),
      avatarPreviewCached: pickBool(o.avatarPreviewCached),
    };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Network error calling ARACHNE bootstrap";
    return { ok: false, error: message };
  }
}

/** Prefer /v1/avatar/bootstrap; on 404/405 use /v1/realtime/token. */
export async function mintArachneSessionForEmployee(
  input: ArachneRealtimeMintInput,
): Promise<
  | (ArachneAvatarBootstrapSuccess & { source: "bootstrap" | "legacy_mint" })
  | ArachneAvatarBootstrapFailure
> {
  const skipBootstrap =
    process.env.ARACHNE_SKIP_AVATAR_BOOTSTRAP?.trim() === "1";

  if (!skipBootstrap) {
    const b = await mintArachneAvatarBootstrap(input);
    if (b.ok) {
      return { ...b, source: "bootstrap" as const };
    }
    if (!b.fallbackToLegacyMint) {
      return b;
    }
  }

  const leg = await mintArachneRealtimeToken(input);
  if (!leg.ok) {
    return { ok: false, error: leg.error, status: leg.status };
  }

  return {
    ok: true,
    token: leg.token,
    websocketUrl: leg.websocketUrl,
    issuedAt: leg.issuedAt,
    expiresAt: leg.expiresAt,
    videoPreviewUrl: null,
    avatarPreviewStatus: null,
    pipelineMode: null,
    arachneOutputProfile: null,
    audioTransport: null,
    avatarPreviewCached: false,
    source: "legacy_mint",
  };
}
