import type { EmployeeConfigJson } from "@/services/db/repositories/employees.repository";

export type EmployeeAvatarPromptContext = {
  displayName: string;
  roleLabel: string;
  behaviorPrompt: string;
  capabilities: string[];
  avatarPlaceholder: string | null;
};

export function buildEmployeeAvatarPromptContext(input: {
  name: string;
  roleColumn: string;
  config: EmployeeConfigJson;
}): EmployeeAvatarPromptContext {
  const cfg = input.config;
  const caps = Array.isArray(cfg.capabilities)
    ? cfg.capabilities.filter((x): x is string => typeof x === "string")
    : [];
  const roleLabel =
    input.roleColumn === "Other" &&
    typeof cfg.roleCustomTitle === "string" &&
    cfg.roleCustomTitle.trim()
      ? cfg.roleCustomTitle.trim()
      : input.roleColumn;

  return {
    displayName: input.name,
    roleLabel,
    behaviorPrompt: typeof cfg.prompt === "string" ? cfg.prompt : "",
    capabilities: caps,
    avatarPlaceholder:
      typeof cfg.avatarPlaceholder === "string" ? cfg.avatarPlaceholder : null,
  };
}

/**
 * Server-only positive/negative prompts for video avatar workers (RunPod / ARACHNE).
 * Template version in config allows evolving copy without breaking in-flight jobs.
 */
export function buildEmployeeAvatarPrompts(ctx: EmployeeAvatarPromptContext): {
  positivePrompt: string;
  negativePrompt: string;
  promptTemplateVersion: number;
} {
  const caps =
    ctx.capabilities.length > 0 ? ctx.capabilities.join(", ") : "general assistance";
  const note = ctx.avatarPlaceholder?.trim()
    ? ` Visual notes: ${ctx.avatarPlaceholder.trim()}.`
    : "";

  const positivePrompt = [
    `Professional digital employee "${ctx.displayName}", role: ${ctx.roleLabel}.`,
    `Behavior and tone guidance: ${ctx.behaviorPrompt || "Helpful, concise, professional."}`,
    `Primary capabilities: ${caps}.${note}`,
    "Speaking to camera with natural lip movement and subtle facial expressions.",
    "Modern office environment, soft cinematic lighting, photorealistic, sharp face, 4k quality.",
    "Corporate attire may include subtle NULLXES branding when appropriate.",
  ].join(" ");

  const negativePrompt =
    "low quality, blurry, deformed face, bad anatomy, extra limbs, watermark, text, logo, flicker, " +
    "teenager, childlike, cartoon, anime, ugly, distorted, old, wrinkles, " +
    "overexposed";

  return {
    positivePrompt,
    negativePrompt,
    promptTemplateVersion: 2,
  };
}

/** Session T2V: base employee prompts plus assistant segment text (cinematic clip). */
export function buildSessionSegmentT2vPrompts(
  ctx: EmployeeAvatarPromptContext,
  segmentText: string,
): {
  positivePrompt: string;
  negativePrompt: string;
  promptTemplateVersion: number;
} {
  const base = buildEmployeeAvatarPrompts(ctx);
  const clip = segmentText.trim().slice(0, 2000);
  return {
    ...base,
    positivePrompt: clip
      ? `${base.positivePrompt} On-screen dialogue / motion aligned with: "${clip}".`
      : base.positivePrompt,
  };
}

/** Positive prompt for RunPod InfiniteTalk (identity + dialogue hint for motion). */
export function buildInfiniteTalkPrompt(
  ctx: EmployeeAvatarPromptContext,
  segmentText: string,
): string {
  const identity = buildEmployeeAvatarPrompts(ctx).positivePrompt;
  const t = segmentText.trim().slice(0, 600);
  if (!t) {
    return `${identity} Speaking naturally to camera, subtle expressions, professional office lighting.`;
  }
  return `${identity} Speaking with clear articulation; dialogue: ${t}`;
}
