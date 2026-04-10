import { NextResponse } from "next/server";

import { runAvatarSyncClip } from "@/lib/avatar/avatar-sync.server";
import { getCurrentSession } from "@/lib/auth/session.server";

export const maxDuration = 180;

export async function POST(req: Request) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = (await req.json().catch(() => null)) as null | Record<string, unknown>;
  if (!raw || typeof raw !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const employeeId =
    typeof raw.employeeId === "string" ? raw.employeeId.trim() : "";
  const text = typeof raw.text === "string" ? raw.text : "";

  if (!employeeId) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }

  const result = await runAvatarSyncClip({
    userId,
    employeeId,
    text,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({
    audioUrl: result.audioUrl,
    videoUrl: result.videoUrl,
  });
}
