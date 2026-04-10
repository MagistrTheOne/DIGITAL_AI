import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/session.server";
import {
  deleteEmployee,
  getEmployeeForDashboard,
  updateEmployee,
} from "@/features/employees/service.server";
import type { CreateEmployeeInput } from "@/features/employees/types";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ employeeId: string }> },
) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { employeeId } = await ctx.params;
  if (!employeeId?.trim()) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }

  const emp = await getEmployeeForDashboard(employeeId);
  if (!emp) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ employee: emp });
}

function parseCreateBody(body: unknown): CreateEmployeeInput | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const role = o.role;
  if (
    role !== "CFO" &&
    role !== "Marketing" &&
    role !== "Operations" &&
    role !== "Product" &&
    role !== "Customer Support" &&
    role !== "Other"
  ) {
    return null;
  }
  const name = typeof o.name === "string" ? o.name : "";
  const prompt = typeof o.prompt === "string" ? o.prompt : "";
  const capabilities = Array.isArray(o.capabilities)
    ? o.capabilities.filter((x): x is string => typeof x === "string")
    : [];
  const roleCustomTitle =
    typeof o.roleCustomTitle === "string" ? o.roleCustomTitle : undefined;
  const avatarPlaceholder =
    typeof o.avatarPlaceholder === "string" ? o.avatarPlaceholder : undefined;
  return {
    role,
    name,
    prompt,
    capabilities,
    ...(role === "Other" ? { roleCustomTitle } : {}),
    ...(avatarPlaceholder !== undefined ? { avatarPlaceholder } : {}),
  };
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ employeeId: string }> },
) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { employeeId } = await ctx.params;
  if (!employeeId?.trim()) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }

  const json = (await req.json().catch(() => null)) as unknown;
  const input = parseCreateBody(json);
  if (!input || !input.name.trim() || !input.prompt.trim()) {
    return NextResponse.json(
      { error: "Invalid body: need role, name, prompt, capabilities[]" },
      { status: 400 },
    );
  }

  const result = await updateEmployee(employeeId, input);
  if (!result.ok) {
    const status =
      result.error === "Not found"
        ? 404
        : result.error === "Unauthorized"
          ? 401
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ employeeId: string }> },
) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { employeeId } = await ctx.params;
  if (!employeeId?.trim()) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }

  const result = await deleteEmployee(employeeId);
  if (!result.ok) {
    const status = result.error === "Not found" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ ok: true });
}
