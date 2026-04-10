/**
 * Server-only mint for ARACHNE-X realtime (line B).
 * POST {ARACHNE_HTTP_BASE}/v1/realtime/token
 */

export type ArachneRealtimeMintSuccess = {
  ok: true;
  token: string;
  websocketUrl: string;
  issuedAt: string;
  expiresAt: string;
};

export type ArachneRealtimeMintFailure = {
  ok: false;
  error: string;
  status?: number;
};

export type ArachneRealtimeMintResult =
  | ArachneRealtimeMintSuccess
  | ArachneRealtimeMintFailure;

export type ArachneRealtimeMintInput = {
  sessionId: string;
  employeeId?: string;
  nullxesSessionId?: string;
};

function getArachneHttpBase(): string | undefined {
  const raw = process.env.ARACHNE_HTTP_BASE?.trim();
  if (!raw) return undefined;
  return raw.replace(/\/+$/, "");
}

function getServiceKey(): string | undefined {
  return process.env.NULLXES_REALTIME_SERVICE_KEY?.trim() || undefined;
}

export async function mintArachneRealtimeToken(
  input: ArachneRealtimeMintInput,
): Promise<ArachneRealtimeMintResult> {
  const base = getArachneHttpBase();
  if (!base) {
    return {
      ok: false,
      error:
        "ARACHNE_HTTP_BASE is not set. Configure the ARACHNE HTTP origin for mint.",
    };
  }

  const url = `${base}/v1/realtime/token`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const key = getServiceKey();
  if (key) {
    headers["X-NULLXES-Realtime-Service-Key"] = key;
  }

  const body: Record<string, string> = {
    sessionId: input.sessionId,
  };
  if (input.employeeId) body.employeeId = input.employeeId;
  if (input.nullxesSessionId) body.nullxesSessionId = input.nullxesSessionId;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let json: unknown;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      return {
        ok: false,
        error: `Invalid JSON from ARACHNE mint (${res.status})`,
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
          : `ARACHNE mint failed (${res.status})`;
      return { ok: false, error: msg, status: res.status };
    }

    if (typeof json !== "object" || json === null) {
      return { ok: false, error: "Invalid mint response shape", status: res.status };
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
        error: "Mint response missing token, websocketUrl, issuedAt, or expiresAt",
        status: res.status,
      };
    }

    return {
      ok: true,
      token,
      websocketUrl,
      issuedAt,
      expiresAt,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error calling ARACHNE mint";
    return { ok: false, error: message };
  }
}
