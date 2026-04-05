import type { ClientApiIntegrationConfig } from "@/lib/integrations/client-api-config.types";
import { decryptIntegrationSecret } from "@/lib/integrations/secret.server";

const FETCH_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_BYTES = 120_000;

function isPrivateHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "0.0.0.0") return true;
  if (h.endsWith(".localhost")) return true;
  if (h === "::1") return true;

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const m = h.match(ipv4);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  return false;
}

/** Normalized https base (origin + optional path, no trailing slash) for stored config. */
export function sanitizeIntegrationBaseUrlInput(raw: string): string {
  const u = normalizeBaseUrl(raw.trim());
  return `${u.origin}${u.pathname}`.replace(/\/+$/, "") || u.origin;
}

function normalizeBaseUrl(raw: string): URL {
  const trimmed = raw.trim().replace(/\/+$/, "");
  const u = new URL(trimmed);
  if (u.protocol !== "https:") {
    throw new Error("client_api_base_url_must_be_https");
  }
  if (isPrivateHostname(u.hostname)) {
    throw new Error("client_api_host_not_allowed");
  }
  return u;
}

function resolveRequestUrl(
  base: URL,
  path: string,
  query?: Record<string, string>,
): URL {
  const p = path.trim();
  if (!p.startsWith("/") || p.startsWith("//") || p.includes("://")) {
    throw new Error("invalid_path");
  }
  const root =
    `${base.origin}${base.pathname}`.replace(/\/+$/, "") || base.origin;
  const target = new URL(`${root}${p}`);
  if (target.origin !== base.origin) {
    throw new Error("client_api_path_escapes_origin");
  }
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      target.searchParams.set(k, v);
    }
  }
  return target;
}

function methodAllowed(
  method: string,
  cfg: ClientApiIntegrationConfig,
): boolean {
  const allowed = (cfg.allowedMethods ?? ["GET", "POST", "PATCH", "PUT"]).map(
    (m) => m.toUpperCase(),
  );
  return allowed.includes(method.toUpperCase());
}

export type ClientApiProxyInput = {
  config: ClientApiIntegrationConfig;
  secretCiphertext: string;
  path: string;
  method: string;
  query?: Record<string, string>;
  jsonBody?: unknown;
};

export async function executeClientApiProxy(
  input: ClientApiProxyInput,
): Promise<{ ok: true; status: number; bodySnippet: string } | { ok: false; error: string }> {
  let base: URL;
  try {
    base = normalizeBaseUrl(input.config.baseUrl);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "invalid_base_url",
    };
  }

  const prefix = input.config.pathPrefix?.trim();
  if (prefix) {
    const norm = prefix.startsWith("/") ? prefix : `/${prefix}`;
    if (!input.path.startsWith(norm) && norm !== "/") {
      return { ok: false, error: "path_not_under_configured_prefix" };
    }
  }

  if (!methodAllowed(input.method, input.config)) {
    return { ok: false, error: "method_not_allowed" };
  }

  let target: URL;
  try {
    target = resolveRequestUrl(base, input.path, input.query);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "invalid_path",
    };
  }

  let apiKey: string;
  try {
    apiKey = decryptIntegrationSecret(input.secretCiphertext);
  } catch {
    return { ok: false, error: "secret_decrypt_failed" };
  }

  const headerName =
    input.config.authHeaderName?.trim() || "Authorization";
  const scheme = input.config.authScheme === "raw" ? "raw" : "bearer";
  const authValue =
    scheme === "bearer" ? `Bearer ${apiKey}` : apiKey;

  const method = input.method.toUpperCase();
  const headers: Record<string, string> = {
    [headerName]: authValue,
    Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
  };

  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD" && input.jsonBody !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(input.jsonBody);
    if (body.length > 256_000) {
      return { ok: false, error: "request_body_too_large" };
    }
  }

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(target.toString(), {
      method,
      headers,
      body,
      signal: ac.signal,
    });

    const buf = await res.arrayBuffer();
    const slice = buf.byteLength > MAX_RESPONSE_BYTES
      ? buf.slice(0, MAX_RESPONSE_BYTES)
      : buf;
    const text = new TextDecoder("utf-8", { fatal: false }).decode(slice);
    const snippet =
      text.length > 24_000 ? `${text.slice(0, 24_000)}…[truncated]` : text;

    return {
      ok: true,
      status: res.status,
      bodySnippet: snippet,
    };
  } catch (e) {
    const msg =
      e instanceof Error && e.name === "AbortError"
        ? "upstream_timeout"
        : e instanceof Error
          ? e.message
          : "fetch_failed";
    return { ok: false, error: msg };
  } finally {
    clearTimeout(t);
  }
}
