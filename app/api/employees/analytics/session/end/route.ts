import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/session.server";
import { endAiWorkspaceSession } from "@/services/db/repositories/telemetry.repository";

export async function POST(req: Request) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as null | {
    clientChatSessionId?: string;
  };
  const id = body?.clientChatSessionId?.trim();
  if (!id) {
    return NextResponse.json(
      { error: "clientChatSessionId is required" },
      { status: 400 },
    );
  }

  try {
    await endAiWorkspaceSession(userId, id);
  } catch {
    return NextResponse.json({ error: "Failed to end session" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
