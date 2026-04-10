import { NextResponse } from "next/server";

import { requestArachneAvatarPreview } from "@/features/arachne-x/server/arachneAvatarPreview.server";
import { getCurrentSession } from "@/lib/auth/session.server";
import {
  buildEmployeeAvatarPromptContext,
  buildEmployeeAvatarPrompts,
} from "@/lib/inference/build-employee-avatar-prompt.server";
import {
  getEmployeeRowById,
  type EmployeeConfigJson,
  updateEmployeeAvatarPreviewState,
  updateEmployeeVideoPreviewUrl,
} from "@/services/db/repositories/employees.repository";

const MAX_REF_IMAGE_CHARS = 2_500_000;

export async function POST(
  req: Request,
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

  const row = await getEmployeeRowById(employeeId, userId);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    referenceImage?: string;
  };
  const referenceImage =
    typeof body.referenceImage === "string" ? body.referenceImage.trim() : undefined;
  if (referenceImage && referenceImage.length > MAX_REF_IMAGE_CHARS) {
    return NextResponse.json(
      { error: "referenceImage payload too large" },
      { status: 413 },
    );
  }

  const cfg = (row.config ?? {}) as EmployeeConfigJson;
  const promptHint = typeof cfg.prompt === "string" ? cfg.prompt : undefined;
  const promptCtx = buildEmployeeAvatarPromptContext({
    name: row.name,
    roleColumn: row.role,
    config: cfg,
  });
  const prompts = buildEmployeeAvatarPrompts(promptCtx);
  const generationProfile =
    cfg.renderProfile &&
    typeof cfg.renderProfile === "object" &&
    !Array.isArray(cfg.renderProfile)
      ? cfg.renderProfile
      : undefined;

  const preview = await requestArachneAvatarPreview({
    employeeId,
    displayName: row.name,
    promptHint,
    positivePrompt: prompts.positivePrompt,
    negativePrompt: prompts.negativePrompt,
    promptTemplateVersion: prompts.promptTemplateVersion,
    referenceImage,
    generationProfile,
  });

  if (!preview.ok) {
    const missingEndpoint =
      preview.error.includes("not set") ||
      preview.error.includes("not configured");
    if (missingEndpoint) {
      return NextResponse.json({ error: preview.error }, { status: 503 });
    }
    await updateEmployeeAvatarPreviewState(employeeId, userId, {
      avatarRenderStatus: "failed",
      avatarPreviewError: preview.error,
      avatarPreviewJobId: null,
    });
    return NextResponse.json(
      {
        error: preview.error,
        upstreamStatus: preview.status ?? null,
      },
      { status: 502 },
    );
  }

  if (preview.mode === "async") {
    const saved = await updateEmployeeAvatarPreviewState(employeeId, userId, {
      avatarRenderStatus: "generating",
      avatarPreviewJobId: preview.jobId,
      avatarPreviewError: null,
    });
    if (!saved) {
      return NextResponse.json({ error: "Failed to save job state" }, { status: 500 });
    }
    return NextResponse.json({ jobId: preview.jobId }, { status: 202 });
  }

  const updated = await updateEmployeeVideoPreviewUrl(
    employeeId,
    userId,
    preview.videoUrl,
  );
  if (!updated) {
    return NextResponse.json({ error: "Failed to save preview URL" }, { status: 500 });
  }

  return NextResponse.json({ videoUrl: preview.videoUrl }, { status: 200 });
}
