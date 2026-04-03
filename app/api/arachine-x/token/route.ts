import { NextResponse } from "next/server";

import type { AvatarTokenClaims } from "@/features/arachine-x/server/tokenClaims.server";
import { mintArachneRealtimeToken } from "@/features/arachine-x/server/arachneRealtimeMint.server";
import { getCurrentSession } from "@/lib/auth/session.server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    sessionId?: string;
    employeeId?: string;
    nullxesSessionId?: string;
  };

  const sessionId = body.sessionId?.trim();
  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 },
    );
  }

  const mint = await mintArachneRealtimeToken({
    sessionId,
    employeeId: body.employeeId?.trim() || undefined,
    nullxesSessionId: body.nullxesSessionId?.trim() || undefined,
  });

  if (!mint.ok) {
    const status =
      mint.status === 401 || mint.status === 403
        ? mint.status
        : mint.status && mint.status >= 400 && mint.status < 500
          ? mint.status
          : 502;
    return NextResponse.json({ error: mint.error }, { status });
  }

  const claims: AvatarTokenClaims = {
    token: mint.token,
    websocketUrl: mint.websocketUrl,
    issuedAt: mint.issuedAt,
    expiresAt: mint.expiresAt,
  };

  return NextResponse.json(claims);
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const mint = await mintArachneRealtimeToken({
    sessionId: `dev_${Date.now()}`,
  });

  if (!mint.ok) {
    return NextResponse.json({ error: mint.error }, { status: 502 });
  }

  const claims: AvatarTokenClaims = {
    token: mint.token,
    websocketUrl: mint.websocketUrl,
    issuedAt: mint.issuedAt,
    expiresAt: mint.expiresAt,
  };

  return NextResponse.json(claims);
}
