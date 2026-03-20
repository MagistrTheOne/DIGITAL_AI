import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/session.server";
import { resolveAnamPersonaIds } from "@/features/employees/anam.server";
import {
  getEmployeeRowById,
  type EmployeeConfigJson,
} from "@/services/db/repositories/employees.repository";

const ANAM_SESSION_URL = "https://api.anam.ai/v1/auth/session-token";

/** Avoid hanging ~90s on dead TLS / blocked networks (override via ANAM_SESSION_FETCH_TIMEOUT_MS). */
function getAnamFetchTimeoutMs(): number {
  const raw = process.env.ANAM_SESSION_FETCH_TIMEOUT_MS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(n) && n >= 5000 && n <= 120_000) return n;
  return 25_000;
}

function describeUpstreamFetchError(err: unknown): string {
  if (err instanceof Error && err.name === "AbortError") {
    return `Anam API timed out after ${getAnamFetchTimeoutMs()}ms.`;
  }
  const msg = err instanceof Error ? err.message : String(err);
  const cause = err instanceof Error ? err.cause : undefined;
  const code =
    cause && typeof cause === "object" && "code" in cause
      ? String((cause as { code?: string }).code)
      : "";
  if (code === "ECONNRESET" || /ECONNRESET/i.test(msg)) {
    return (
      "Network: TLS connection to api.anam.ai was reset (ECONNRESET). " +
      "Try: disable VPN/proxy, allow outbound HTTPS, different network, or retry."
    );
  }
  if (code === "ETIMEDOUT" || /ETIMEDOUT|timed out/i.test(msg)) {
    return "Network: connection to api.anam.ai timed out.";
  }
  if (code === "ENOTFOUND" || /getaddrinfo/i.test(msg)) {
    return "DNS: could not resolve api.anam.ai.";
  }
  return msg || "Upstream fetch failed";
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANAM_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Anam is not configured (ANAM_API_KEY)" },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    employeeId?: string;
  };
  const employeeId = body.employeeId?.trim();
  if (!employeeId) {
    return NextResponse.json({ error: "employeeId required" }, { status: 400 });
  }

  const row = await getEmployeeRowById(employeeId, userId);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cfg = (row.config ?? {}) as EmployeeConfigJson;
  const { avatarId, voiceId, llmId, environmentId } = resolveAnamPersonaIds(
    employeeId,
    cfg,
  );

  if (!avatarId || !voiceId || !llmId) {
    return NextResponse.json(
      {
        error:
          "Missing Anam persona ids. Set ANAM_VOICE_ID, ANAM_LLM_ID and avatar (config or ANAM_AVATAR_ID / test employee defaults).",
      },
      { status: 400 },
    );
  }

  const displayName = row.name.replace(/\s+Vantage$/i, "").trim() || "Assistant";
  const systemPrompt =
    typeof cfg.prompt === "string" && cfg.prompt.trim()
      ? cfg.prompt
      : "You are a helpful assistant.";

  const payload: Record<string, unknown> = {
    clientLabel: `dai_saas:${employeeId}`,
    personaConfig: {
      name: displayName.slice(0, 64),
      avatarId,
      voiceId,
      llmId,
      systemPrompt,
    },
  };

  // OpenAPI for session-token does not document environmentId; enable explicitly if your Lab expects it.
  if (
    environmentId &&
    process.env.ANAM_SESSION_SEND_ENVIRONMENT === "1"
  ) {
    payload.environmentId = environmentId;
  }

  const timeoutMs = getAnamFetchTimeoutMs();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(ANAM_SESSION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: ac.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    const detail = describeUpstreamFetchError(e);
    return NextResponse.json(
      {
        error: detail,
        code: "ANAM_UPSTREAM_UNREACHABLE",
      },
      { status: 503 },
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  if (!res.ok) {
    return NextResponse.json(
      { error: text || `Anam error ${res.status}` },
      { status: res.status >= 400 && res.status < 600 ? res.status : 502 },
    );
  }

  let data: { sessionToken?: string };
  try {
    data = JSON.parse(text) as { sessionToken?: string };
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON from Anam" },
      { status: 502 },
    );
  }

  if (!data.sessionToken) {
    return NextResponse.json(
      { error: "No sessionToken in Anam response" },
      { status: 502 },
    );
  }

  return NextResponse.json({ sessionToken: data.sessionToken });
}
