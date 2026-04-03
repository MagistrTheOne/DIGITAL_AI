import { NextResponse } from "next/server";

import { isNullxesRealtimeVoiceEnvEnabled } from "@/lib/env/nullxes-realtime-voice.server";
import { mintEmployeeRealtimeClientSecret } from "@/lib/openai/employee-realtime-voice.server";
import { getCurrentSession } from "@/lib/auth/session.server";
import {
  getEmployeeRowById,
  type EmployeeConfigJson,
} from "@/services/db/repositories/employees.repository";

export async function POST(req: Request) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isNullxesRealtimeVoiceEnvEnabled()) {
    return NextResponse.json({ error: "Voice realtime is disabled" }, { status: 403 });
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as null | {
    employeeId?: string;
  };
  const employeeId = body?.employeeId?.trim();
  if (!employeeId) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }

  const row = await getEmployeeRowById(employeeId, userId);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cfg = (row.config ?? {}) as EmployeeConfigJson;

  try {
    const { clientSecret, expiresAt, model, voiceMode } =
      await mintEmployeeRealtimeClientSecret({
        displayName: row.name,
        role: row.role,
        config: cfg,
      });
    return NextResponse.json({
      model,
      clientSecret,
      expiresAt,
      voiceMode,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
