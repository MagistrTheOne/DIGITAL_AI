import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/session.server";
import {
  defaultClientApiConfig,
  type ClientApiIntegrationConfig,
} from "@/lib/integrations/client-api-config.types";
import { sanitizeIntegrationBaseUrlInput } from "@/lib/integrations/client-api-proxy.server";
import {
  encryptIntegrationSecret,
  isIntegrationsEncryptionConfigured,
} from "@/lib/integrations/secret.server";
import { getEmployeeRowById } from "@/services/db/repositories/employees.repository";
import {
  deleteClientIntegration,
  getClientIntegrationForOwner,
  mapIntegrationToPublic,
  updateClientIntegration,
} from "@/services/db/repositories/employee-integration.repository";

const METHOD_SET = new Set(["GET", "POST", "PUT", "PATCH"]);

function parseAllowedMethods(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim().toUpperCase())
    .filter((x) => METHOD_SET.has(x));
  return out.length ? [...new Set(out)] : undefined;
}

export async function PATCH(
  req: Request,
  ctx: {
    params: Promise<{ employeeId: string; integrationId: string }>;
  },
) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { employeeId, integrationId } = await ctx.params;
  const row = await getEmployeeRowById(employeeId, userId);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await getClientIntegrationForOwner(
    userId,
    employeeId,
    integrationId,
  );
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as null | {
    name?: string;
    enabled?: boolean;
    baseUrl?: string;
    apiKey?: string;
    pathPrefix?: string | null;
    allowedMethods?: unknown;
  };

  const prevCfg = (existing.config ?? {}) as ClientApiIntegrationConfig;
  if (!prevCfg.baseUrl || typeof prevCfg.baseUrl !== "string") {
    return NextResponse.json({ error: "Invalid stored config" }, { status: 500 });
  }

  let baseUrl = prevCfg.baseUrl;
  if (typeof body?.baseUrl === "string" && body.baseUrl.trim()) {
    try {
      baseUrl = sanitizeIntegrationBaseUrlInput(body.baseUrl);
    } catch {
      return NextResponse.json(
        { error: "baseUrl must be a public https URL" },
        { status: 400 },
      );
    }
  }

  let pathPrefix: string | undefined = prevCfg.pathPrefix;
  if (body?.pathPrefix !== undefined) {
    if (body.pathPrefix === null || body.pathPrefix === "") {
      pathPrefix = undefined;
    } else if (typeof body.pathPrefix === "string") {
      const p = body.pathPrefix.trim();
      pathPrefix = p.startsWith("/") ? p : `/${p}`;
    }
  }

  let allowedMethods = prevCfg.allowedMethods;
  if (body?.allowedMethods !== undefined) {
    allowedMethods = parseAllowedMethods(body.allowedMethods);
  }

  const nextCfg = defaultClientApiConfig({
    baseUrl,
    pathPrefix,
    allowedMethods,
    authHeaderName: prevCfg.authHeaderName,
    authScheme: prevCfg.authScheme === "raw" ? "raw" : "bearer",
  });

  let secretCiphertext: string | undefined;
  if (typeof body?.apiKey === "string" && body.apiKey.trim()) {
    if (!isIntegrationsEncryptionConfigured()) {
      return NextResponse.json(
        { error: "INTEGRATIONS_ENCRYPTION_KEY is not set" },
        { status: 503 },
      );
    }
    try {
      secretCiphertext = encryptIntegrationSecret(body.apiKey.trim());
    } catch {
      return NextResponse.json({ error: "encrypt_failed" }, { status: 503 });
    }
  }

  const updated = await updateClientIntegration(userId, employeeId, integrationId, {
    ...(typeof body?.name === "string" ? { name: body.name } : {}),
    ...(typeof body?.enabled === "boolean" ? { enabled: body.enabled } : {}),
    config: nextCfg,
    ...(secretCiphertext !== undefined ? { secretCiphertext } : {}),
  });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ integration: mapIntegrationToPublic(updated) });
}

export async function DELETE(
  _req: Request,
  ctx: {
    params: Promise<{ employeeId: string; integrationId: string }>;
  },
) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { employeeId, integrationId } = await ctx.params;
  const row = await getEmployeeRowById(employeeId, userId);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ok = await deleteClientIntegration(userId, employeeId, integrationId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
