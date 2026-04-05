import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/session.server";
import { getEmployeeRowById } from "@/services/db/repositories/employees.repository";
import { deleteKnowledgeDocumentForOwner } from "@/services/db/repositories/knowledge.repository";

export async function DELETE(
  _req: Request,
  ctx: {
    params: Promise<{ employeeId: string; documentId: string }>;
  },
) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { employeeId, documentId } = await ctx.params;
  const row = await getEmployeeRowById(employeeId, userId);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ok = await deleteKnowledgeDocumentForOwner(
    userId,
    employeeId,
    documentId,
  );
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
