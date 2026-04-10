import { NextResponse } from "next/server";

import { enqueueAvatarRenderJobs } from "@/lib/avatar/renderer.server";

/** InfiniteTalk uses RunPod `runsync` — allow long serverless duration when deployed on Vercel. */
export const maxDuration = 180;
import type { AvatarRenderRequestBody } from "@/lib/avatar/types";
import { normalizeAvatarEngine } from "@/lib/avatar/types";
import { getCurrentSession } from "@/lib/auth/session.server";

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

  const sessionId =
    typeof raw.sessionId === "string" ? raw.sessionId.trim() : "";
  const employeeId =
    typeof raw.employeeId === "string" ? raw.employeeId.trim() : "";
  const sequence = typeof raw.sequence === "number" ? raw.sequence : Number.NaN;

  const body: AvatarRenderRequestBody = {
    sessionId,
    employeeId,
    sequence,
    audioUrl: typeof raw.audioUrl === "string" ? raw.audioUrl : undefined,
    imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : undefined,
    text: typeof raw.text === "string" ? raw.text : undefined,
    engine: normalizeAvatarEngine(
      typeof raw.engine === "string" ? raw.engine : undefined,
    ),
    hybridEnhance: raw.hybridEnhance === true,
  };

  const result = await enqueueAvatarRenderJobs({ userId, body });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.httpStatus },
    );
  }

  return NextResponse.json({ jobs: result.jobs });
}
