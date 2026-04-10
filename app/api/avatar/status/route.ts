import { NextResponse } from "next/server";

import { syncAvatarRenderJobRow } from "@/lib/avatar/runpod-sync.server";
import type { AvatarEngine, AvatarRenderJobStatus, AvatarVideoTier } from "@/lib/avatar/types";
import { getCurrentSession } from "@/lib/auth/session.server";
import { findAvatarRenderJobByIdForUser } from "@/services/db/repositories/avatar-render-jobs.repository";

function normalizeEngine(v: string): AvatarEngine {
  if (
    v === "arachne_t2v" ||
    v === "sadtalker" ||
    v === "ditto" ||
    v === "infinitetalk"
  ) {
    return v;
  }
  return "ditto";
}

function normalizeTier(v: string): AvatarVideoTier {
  return v === "enhanced" ? "enhanced" : "realtime";
}

function normalizeStatus(v: string): AvatarRenderJobStatus {
  if (v === "ready" || v === "failed" || v === "queued" || v === "processing") {
    return v;
  }
  return "queued";
}

export async function GET(req: Request) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });
  }

  let row = await findAvatarRenderJobByIdForUser(id, userId);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  row = await syncAvatarRenderJobRow(row, userId);

  const engineUsed = row.engineUsed?.trim() || row.engineRequested;
  return NextResponse.json({
    status: normalizeStatus(row.status),
    videoUrl: row.videoUrl ?? null,
    progress: row.progress,
    engine: normalizeEngine(engineUsed),
    videoTier: normalizeTier(row.videoTier),
    parentJobId: row.parentJobId ?? null,
    error: row.error ?? null,
    runpodJobId: row.runpodJobId ?? null,
  });
}
