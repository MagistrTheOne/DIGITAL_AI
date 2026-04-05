import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/session.server";
import { getEmployeeRowById } from "@/services/db/repositories/employees.repository";
import { recordChatTurnTelemetry } from "@/services/db/repositories/telemetry.repository";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as null | {
    employeeId?: string;
    clientSessionId?: string;
    latencyMs?: number;
    success?: boolean;
    tokensDelta?: number;
  };

  const employeeId = body?.employeeId?.trim();
  const clientSessionId = body?.clientSessionId?.trim();
  if (!employeeId || !clientSessionId) {
    return NextResponse.json(
      { error: "employeeId and clientSessionId are required" },
      { status: 400 },
    );
  }

  const latencyMs =
    typeof body?.latencyMs === "number" && Number.isFinite(body.latencyMs)
      ? Math.max(0, Math.floor(body.latencyMs))
      : 0;
  const success = Boolean(body?.success);
  const tokensDelta =
    typeof body?.tokensDelta === "number" && Number.isFinite(body.tokensDelta)
      ? Math.max(0, Math.floor(body.tokensDelta))
      : 0;

  const row = await getEmployeeRowById(employeeId, userId);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await recordChatTurnTelemetry({
      userId,
      employeeId,
      clientSessionId,
      latencyMs,
      tokensDelta,
      success,
      channel: "arachne",
    });
  } catch {
    return NextResponse.json({ error: "Telemetry write failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
