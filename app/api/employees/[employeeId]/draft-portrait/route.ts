import { NextResponse } from "next/server";

import { resolvePortraitLookDetailForGeneration } from "@/lib/avatar/avatar-appearance-normalize";
import { getCurrentSession } from "@/lib/auth/session.server";
import { generateDigitalHumanPortraitPng } from "@/lib/inference/openai-digital-human-portrait.server";
import { storeDigitalHumanPortraitPng } from "@/lib/storage/digital-human-portrait.server";
import {
  getEmployeeRowById,
  type EmployeeConfigJson,
  updateEmployeeRow,
} from "@/services/db/repositories/employees.repository";

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

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 },
    );
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN is required to store the portrait" },
      { status: 503 },
    );
  }

  const row = await getEmployeeRowById(employeeId, userId);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (row.status !== "draft") {
    return NextResponse.json(
      { error: "Portrait preview is only available for draft employees" },
      { status: 400 },
    );
  }

  const cfg = (row.config ?? {}) as EmployeeConfigJson;
  const raw =
    typeof cfg.avatarPlaceholder === "string" ? cfg.avatarPlaceholder : "";
  const roleLabel =
    row.role === "Other" && typeof cfg.roleCustomTitle === "string"
      ? cfg.roleCustomTitle.trim() || row.role
      : row.role;
  const detail = resolvePortraitLookDetailForGeneration({
    rawPlaceholder: raw,
    roleLabel,
    displayName: row.name,
  });

  const gen = await generateDigitalHumanPortraitPng({
    apiKey,
    avatarPlaceholder: detail,
  });
  if (!gen.ok) {
    return NextResponse.json({ error: gen.error }, { status: 502 });
  }

  try {
    const { url } = await storeDigitalHumanPortraitPng({
      userId,
      employeeId,
      png: gen.png,
    });
    await updateEmployeeRow({
      employeeId,
      userId,
      config: {
        identityReferenceImageUrl: url,
      },
    });
    return NextResponse.json({ ok: true, imageUrl: url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to store portrait";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
