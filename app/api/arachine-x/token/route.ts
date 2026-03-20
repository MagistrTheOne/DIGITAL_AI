import { NextResponse } from "next/server";

import { issueAvatarTokenClaims } from "@/features/arachine-x/server/tokenClaims.server";

export const runtime = "edge";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { sessionId?: string };
  const sessionId = body.sessionId ?? "dev-session";

  const claims = await issueAvatarTokenClaims({ sessionId });
  return NextResponse.json(claims);
}

// Optional GET for simple testing (no session bootstrap persisted).
export async function GET() {
  const claims = await issueAvatarTokenClaims({ sessionId: "dev-session" });
  return NextResponse.json(claims);
}

