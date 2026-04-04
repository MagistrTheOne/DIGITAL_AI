import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/session.server";
import { getRealtimeStats } from "@/services/db/repositories/analytics.repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const realtime = await getRealtimeStats(userId);
  return NextResponse.json({ realtime });
}
