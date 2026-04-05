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
  insertClientIntegration,
  listClientIntegrationsForEmployee,
  mapIntegrationToPublic,
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

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ employeeId: string }> },
) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { employeeId } = await ctx.params;
  const row = await getEmployeeRowById(employeeId, userId);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const list = await listClientIntegrationsForEmployee(userId, employeeId);
  return NextResponse.json({ integrations: list });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ employeeId: string }> },
) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isIntegrationsEncryptionConfigured()) {
    return NextResponse.json(
      {
        error:
          "Server misconfiguration: set INTEGRATIONS_ENCRYPTION_KEY to store API keys.",
      },
      { status: 503 },
    );
  }

  const { employeeId } = await ctx.params;
  const row = await getEmployeeRowById(employeeId, userId);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as null | {
    name?: string;
    baseUrl?: string;
    apiKey?: string;
    pathPrefix?: string;
    allowedMethods?: unknown;
  };

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const baseUrlRaw = typeof body?.baseUrl === "string" ? body.baseUrl.trim() : "";
  const apiKey = typeof body?.apiKey === "string" ? body.apiKey : "";

  if (!name || !baseUrlRaw || !apiKey.trim()) {
    return NextResponse.json(
      { error: "name, baseUrl, and apiKey are required" },
      { status: 400 },
    );
  }

  let baseUrl: string;
  try {
    baseUrl = sanitizeIntegrationBaseUrlInput(baseUrlRaw);
  } catch {
    return NextResponse.json(
      { error: "baseUrl must be a public https URL" },
      { status: 400 },
    );
  }

  const pathPrefix =
    typeof body?.pathPrefix === "string" && body.pathPrefix.trim()
      ? body.pathPrefix.trim().startsWith("/")
        ? body.pathPrefix.trim()
        : `/${body.pathPrefix.trim()}`
      : undefined;

  const allowedMethods = parseAllowedMethods(body?.allowedMethods);

  const config: ClientApiIntegrationConfig = defaultClientApiConfig({
    baseUrl,
    pathPrefix,
    allowedMethods,
  });

  let secretCiphertext: string;
  try {
    secretCiphertext = encryptIntegrationSecret(apiKey.trim());
  } catch {
    return NextResponse.json(
      { error: "Could not encrypt secret (check INTEGRATIONS_ENCRYPTION_KEY)" },
      { status: 503 },
    );
  }

  const created = await insertClientIntegration({
    userId,
    employeeId,
    name,
    config,
    secretCiphertext,
  });

  return NextResponse.json({
    integration: mapIntegrationToPublic(created),
  });
}
