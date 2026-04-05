import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/session.server";
import type { ClientApiIntegrationConfig } from "@/lib/integrations/client-api-config.types";
import { executeClientApiProxy } from "@/lib/integrations/client-api-proxy.server";
import { getEmployeeRowById } from "@/services/db/repositories/employees.repository";
import { getClientIntegrationForOwner } from "@/services/db/repositories/employee-integration.repository";

export async function POST(
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
  const emp = await getEmployeeRowById(employeeId, userId);
  if (!emp) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const integration = await getClientIntegrationForOwner(
    userId,
    employeeId,
    integrationId,
  );
  if (!integration || integration.kind !== "client_api") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!integration.enabled) {
    return NextResponse.json({ error: "Integration disabled" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as null | {
    path?: string;
    method?: string;
  };

  const path =
    typeof body?.path === "string" && body.path.trim()
      ? body.path.trim().startsWith("/")
        ? body.path.trim()
        : `/${body.path.trim()}`
      : "/";
  const method =
    typeof body?.method === "string" && body.method.trim()
      ? body.method.trim().toUpperCase()
      : "GET";

  const cfg = integration.config as ClientApiIntegrationConfig;
  if (!cfg?.baseUrl) {
    return NextResponse.json({ error: "Invalid config" }, { status: 400 });
  }

  const result = await executeClientApiProxy({
    config: cfg,
    secretCiphertext: integration.secretCiphertext,
    path,
    method,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    status: result.status,
    bodyPreview: result.bodySnippet,
  });
}
