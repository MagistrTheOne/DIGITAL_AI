import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/session.server";
import { getEmployeeById } from "@/services/db/repositories/employees.repository";

export async function GET(
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

  const emp = await getEmployeeById(employeeId, userId);
  if (!emp) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: emp.avatar_render_status,
    stage: emp.avatar_render_stage,
    error: emp.avatar_preview_error,
    videoUrl: emp.video_preview_url,
  });
}
