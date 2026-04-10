import { NextResponse } from "next/server";

import { runAutoDigitalHumanPipeline } from "@/lib/avatar/auto-digital-human.server";
import { isAutoDigitalHumanPipelineEnabled } from "@/lib/avatar/auto-digital-human-env.server";
import { getCurrentSession } from "@/lib/auth/session.server";
import { updateEmployeeRow } from "@/services/db/repositories/employees.repository";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ employeeId: string }> },
) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { employeeId } = await ctx.params;
  if (!employeeId?.trim()) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }

  if (!isAutoDigitalHumanPipelineEnabled()) {
    return NextResponse.json(
      { error: "Auto digital human pipeline is not enabled" },
      { status: 400 },
    );
  }

  const ok = await updateEmployeeRow({
    employeeId,
    userId,
    config: {
      avatarPreviewError: null,
      autoDigitalHumanRunStartedAt: null,
      avatarRenderStage: null,
    },
  });
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  void runAutoDigitalHumanPipeline({ employeeId, userId }).catch((err) => {
    console.error("[NULLXES] avatar-generation-retry pipeline:", err);
  });

  return NextResponse.json({ ok: true });
}
