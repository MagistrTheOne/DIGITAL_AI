import { NextResponse } from "next/server";

import { runEmployeeIdentityClip } from "@/lib/avatar/identity-clip.server";
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
  const imageUrl = typeof raw.imageUrl === "string" ? raw.imageUrl.trim() : "";
  const text = typeof raw.text === "string" ? raw.text : undefined;

  if (!employeeId) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }
  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
  }

  const result = await runEmployeeIdentityClip({
    userId,
    employeeId,
    imageUrl,
    text,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({
    videoUrl: result.videoUrl,
    cached: result.cached,
  });
}
