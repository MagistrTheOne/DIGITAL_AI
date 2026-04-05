import { requestArachneAvatarPreview } from "@/features/arachine-x/server/arachneAvatarPreview.server";
import {
  buildEmployeeAvatarPromptContext,
  buildEmployeeAvatarPrompts,
} from "@/lib/inference/build-employee-avatar-prompt.server";
import {
  enqueueRunPodAvatarJobIfConfigured,
  isRunPodAvatarConfigured,
} from "@/lib/inference/runpod-avatar.server";
import {
  type EmployeeConfigJson,
  updateEmployeeAvatarPreviewState,
  updateEmployeeVideoPreviewUrl,
} from "@/services/db/repositories/employees.repository";

export function isArachneAvatarPreviewConfigured(): boolean {
  return Boolean(process.env.ARACHNE_AVATAR_PREVIEW_URL?.trim());
}

/**
 * After an employee is activated: RunPod if configured (wins over ARACHNE);
 * else ARACHNE/desktop `ARACHNE_AVATAR_PREVIEW_URL` if set.
 * Non-blocking for the HTTP response; failures are written to employee config.
 */
export function enqueuePostDeployAvatarGeneration(input: {
  employeeId: string;
  userId: string;
  name: string;
  role: string;
  config: EmployeeConfigJson;
}): void {
  if (isRunPodAvatarConfigured()) {
    void enqueueRunPodAvatarJobIfConfigured({
      employeeId: input.employeeId,
      userId: input.userId,
    });
    return;
  }
  if (!isArachneAvatarPreviewConfigured()) return;

  void runArachneAvatarPreviewAfterDeploy(input).catch((e) => {
    const msg = e instanceof Error ? e.message : "Avatar generation failed";
    void updateEmployeeAvatarPreviewState(input.employeeId, input.userId, {
      avatarRenderStatus: "failed",
      avatarPreviewError: msg,
      avatarPreviewJobId: null,
    });
  });
}

async function runArachneAvatarPreviewAfterDeploy(input: {
  employeeId: string;
  userId: string;
  name: string;
  role: string;
  config: EmployeeConfigJson;
}): Promise<void> {
  const cfg = input.config;
  const ctx = buildEmployeeAvatarPromptContext({
    name: input.name,
    roleColumn: input.role,
    config: cfg,
  });
  const prompts = buildEmployeeAvatarPrompts(ctx);
  const promptHint = typeof cfg.prompt === "string" ? cfg.prompt : undefined;
  const generationProfile =
    cfg.renderProfile &&
    typeof cfg.renderProfile === "object" &&
    !Array.isArray(cfg.renderProfile)
      ? cfg.renderProfile
      : undefined;

  const preview = await requestArachneAvatarPreview({
    employeeId: input.employeeId,
    displayName: input.name,
    promptHint,
    positivePrompt: prompts.positivePrompt,
    negativePrompt: prompts.negativePrompt,
    promptTemplateVersion: prompts.promptTemplateVersion,
    generationProfile,
  });

  if (!preview.ok) {
    await updateEmployeeAvatarPreviewState(input.employeeId, input.userId, {
      avatarRenderStatus: "failed",
      avatarPreviewError: preview.error,
      avatarPreviewJobId: null,
    });
    return;
  }
  if (preview.mode === "async") {
    await updateEmployeeAvatarPreviewState(input.employeeId, input.userId, {
      avatarRenderStatus: "generating",
      avatarPreviewJobId: preview.jobId,
      avatarPreviewError: null,
    });
    return;
  }
  await updateEmployeeVideoPreviewUrl(
    input.employeeId,
    input.userId,
    preview.videoUrl,
  );
}
