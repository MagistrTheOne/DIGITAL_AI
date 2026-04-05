import { NextResponse } from "next/server";

import type { JobStatusResponse } from "@/features/employees/avatar-preview.types";
import { getCurrentSession } from "@/lib/auth/session.server";
import { fetchRunPodJobStatus } from "@/lib/inference/runpod-avatar.server";
import {
  findEmployeeRowByPreviewJobId,
  type EmployeeConfigJson,
  updateEmployeeAvatarPreviewState,
  updateEmployeeVideoPreviewUrl,
} from "@/services/db/repositories/employees.repository";

function jobStatusFromConfig(cfg: EmployeeConfigJson): JobStatusResponse {
  if (cfg.avatarRenderStatus === "failed") {
    return {
      status: "failed",
      error:
        typeof cfg.avatarPreviewError === "string"
          ? cfg.avatarPreviewError
          : "Generation failed",
    };
  }
  if (
    cfg.avatarRenderStatus === "ready" ||
    (typeof cfg.videoPreviewUrl === "string" && cfg.videoPreviewUrl.length > 0)
  ) {
    const url =
      typeof cfg.videoPreviewUrl === "string" ? cfg.videoPreviewUrl : undefined;
    return { status: "ready", videoUrl: url };
  }
  if (cfg.avatarRenderStatus === "generating") {
    return { status: "generating" };
  }
  return { status: "idle" };
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ jobId: string }> },
) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await ctx.params;
  if (!jobId?.trim()) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  const row = await findEmployeeRowByPreviewJobId(userId, jobId.trim());
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const employeeId = row.id;
  const cfg = (row.config ?? {}) as EmployeeConfigJson;

  const runpod = await fetchRunPodJobStatus(jobId.trim());
  if (runpod.ok) {
    if (runpod.body.status === "ready" && runpod.videoUrl) {
      await updateEmployeeVideoPreviewUrl(employeeId, userId, runpod.videoUrl);
      return NextResponse.json({
        status: "ready",
        videoUrl: runpod.videoUrl,
      } as JobStatusResponse);
    }
    if (runpod.body.status === "failed") {
      await updateEmployeeAvatarPreviewState(employeeId, userId, {
        avatarRenderStatus: "failed",
        avatarPreviewError: runpod.body.error ?? "Generation failed",
        avatarPreviewJobId: null,
      });
      return NextResponse.json(runpod.body as JobStatusResponse);
    }
    if (runpod.body.status === "generating") {
      return NextResponse.json({ status: "generating" } as JobStatusResponse);
    }
  }

  const base = jobStatusFromConfig(cfg);
  const arachneStatusUrl = process.env.ARACHNE_PREVIEW_JOB_STATUS_URL?.trim();
  if (arachneStatusUrl && base.status === "generating") {
    try {
      const url = arachneStatusUrl.includes("{jobId}")
        ? arachneStatusUrl.replace(/\{jobId\}/g, encodeURIComponent(jobId.trim()))
        : `${arachneStatusUrl.replace(/\/$/, "")}/${encodeURIComponent(jobId.trim())}`;
      const key = process.env.NULLXES_REALTIME_SERVICE_KEY?.trim();
      const res = await fetch(url, {
        headers: {
          ...(key ? { "X-NULLXES-Realtime-Service-Key": key } : {}),
        },
        signal: AbortSignal.timeout(45_000),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (res.ok) {
        const videoUrl =
          (typeof data.videoUrl === "string" && data.videoUrl) ||
          (typeof data.url === "string" && data.url) ||
          "";
        const st = typeof data.status === "string" ? data.status.toLowerCase() : "";
        if (st === "ready" || st === "completed" || st === "success") {
          if (videoUrl.startsWith("http")) {
            await updateEmployeeVideoPreviewUrl(employeeId, userId, videoUrl);
            return NextResponse.json({
              status: "ready",
              videoUrl,
            } satisfies JobStatusResponse);
          }
        }
        if (st === "failed" || st === "error") {
          const err =
            (typeof data.error === "string" && data.error) ||
            (typeof data.message === "string" && data.message) ||
            "Generation failed";
          await updateEmployeeAvatarPreviewState(employeeId, userId, {
            avatarRenderStatus: "failed",
            avatarPreviewError: err,
            avatarPreviewJobId: null,
          });
          return NextResponse.json({ status: "failed", error: err });
        }
      }
    } catch {
      /* fall through to DB snapshot */
    }
  }

  return NextResponse.json(base);
}
