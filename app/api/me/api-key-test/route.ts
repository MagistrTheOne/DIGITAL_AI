import { NextResponse } from "next/server";

import { verifyUserApiKeyFromRequest } from "@/lib/auth/api-key.server";

/**
 * Smoke-test programmatic access. Send `Authorization: Bearer sk_live_…`.
 */
export async function GET(request: Request) {
  const r = await verifyUserApiKeyFromRequest(request);
  if (!r) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true, userId: r.userId });
}
