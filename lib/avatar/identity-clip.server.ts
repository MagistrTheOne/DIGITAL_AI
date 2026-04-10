import { createHash } from "node:crypto";

import {
  buildEmployeeAvatarPromptContext,
  buildEmployeeAvatarPrompts,
} from "@/lib/inference/build-employee-avatar-prompt.server";
import { runInfiniteTalkSync } from "@/lib/inference/runpod-infinitetalk.server";
import { ELEVENLABS_TTS_MODEL_IDS } from "@/lib/inference/runtime-catalog.constants";
import {
  elevenLabsLanguageCodeFromWorkspaceLanguage,
  synthesizeElevenLabsTtsMp3,
} from "@/lib/inference/providers/elevenlabs-tts.server";
import { persistRemoteAvatarVideoMp4 } from "@/lib/storage/avatar-generated-video.server";
import { storeAvatarSessionAudioMp3 } from "@/lib/storage/avatar-session-media.server";
import { getSettingsForUser } from "@/services/db/repositories/settings.repository.server";
import {
  getEmployeeRowById,
  type EmployeeConfigJson,
  updateEmployeeRow,
} from "@/services/db/repositories/employees.repository";

import { isIdentityClipInfrastructureConfigured } from "@/lib/avatar/identity-clip-env.server";

const VOICE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
const PROMPT_SUFFIX = " professional, realistic lighting, clean face";
const DEFAULT_INTRO_TEXT =
  "Hello. I'm your digital colleague and I'm here to help.";
const SIZE = "480p" as const;

/** First public https URL: saved identity ref, else `avatarPlaceholder` if it looks like a URL. */
export function resolveIdentityClipImageUrlFromRecord(r: {
  identity_reference_image_url: string | null;
  avatar_placeholder: string | null;
}): string | null {
  const id = r.identity_reference_image_url?.trim() ?? "";
  if (/^https?:\/\//i.test(id)) return id;
  const ph = r.avatar_placeholder?.trim() ?? "";
  if (/^https?:\/\//i.test(ph)) return ph;
  return null;
}

export function computeIdentityClipInputHash(input: {
  imageUrl: string;
  text: string;
  promptTemplateVersion: number;
  size: string;
}): string {
  const h = createHash("sha256");
  h.update(input.imageUrl.trim());
  h.update("\0");
  h.update(input.text.trim());
  h.update("\0");
  h.update(String(input.promptTemplateVersion));
  h.update("\0");
  h.update(input.size);
  return h.digest("hex");
}

export function buildIdentityClipInfiniteTalkPrompt(
  baseBehaviorPrompt: string,
  text: string,
): string {
  const base = baseBehaviorPrompt.trim() || "Professional digital assistant.";
  const t = text.trim() || DEFAULT_INTRO_TEXT;
  return `${base} speaking: ${t}${PROMPT_SUFFIX}`;
}

export async function runEmployeeIdentityClip(input: {
  userId: string;
  employeeId: string;
  imageUrl: string;
  text?: string;
}): Promise<
  | { ok: true; videoUrl: string; cached: boolean }
  | { ok: false; error: string; httpStatus: number }
> {
  const imageUrlEarly = input.imageUrl.trim();
  if (!/^https?:\/\//i.test(imageUrlEarly)) {
    return {
      ok: false,
      error: "imageUrl must be a public https URL.",
      httpStatus: 400,
    };
  }

  const row = await getEmployeeRowById(input.employeeId, input.userId);
  if (!row) {
    return { ok: false, error: "Employee not found", httpStatus: 404 };
  }

  if (!isIdentityClipInfrastructureConfigured()) {
    const msg =
      "Identity clip is not configured (RUNPOD_API_KEY, ELEVENLABS_API_KEY, and BLOB_READ_WRITE_TOKEN required in production).";
    await updateEmployeeRow({
      employeeId: input.employeeId,
      userId: input.userId,
      config: {
        avatarRenderStatus: "failed",
        avatarPreviewError: msg,
      },
    });
    return {
      ok: false,
      error: msg,
      httpStatus: 503,
    };
  }

  const imageUrl = imageUrlEarly;

  const cfg = (row.config ?? {}) as EmployeeConfigJson;
  const segmentText =
    typeof input.text === "string" && input.text.trim()
      ? input.text.trim().slice(0, 4000)
      : DEFAULT_INTRO_TEXT;

  const promptCtx = buildEmployeeAvatarPromptContext({
    name: row.name,
    roleColumn: row.role,
    config: cfg,
  });
  const { promptTemplateVersion } = buildEmployeeAvatarPrompts(promptCtx);
  const behaviorBase =
    typeof cfg.prompt === "string" && cfg.prompt.trim() ? cfg.prompt : "";
  const infinitePrompt = buildIdentityClipInfiniteTalkPrompt(
    behaviorBase,
    segmentText,
  );

  const inputHash = computeIdentityClipInputHash({
    imageUrl,
    text: segmentText,
    promptTemplateVersion,
    size: SIZE,
  });

  const existingUrl =
    typeof cfg.videoPreviewUrl === "string" ? cfg.videoPreviewUrl.trim() : "";
  if (
    cfg.identityClipInputHash === inputHash &&
    cfg.identityClipPromptTemplateVersion === promptTemplateVersion &&
    /^https?:\/\//i.test(existingUrl)
  ) {
    return { ok: true, videoUrl: existingUrl, cached: true };
  }

  await updateEmployeeRow({
    employeeId: input.employeeId,
    userId: input.userId,
    config: {
      avatarRenderStatus: "generating",
      avatarPreviewError: null,
    },
  });

  const apiKey = process.env.ELEVENLABS_API_KEY!.trim();
  const settings = await getSettingsForUser(input.userId);
  const voiceId = settings?.ttsVoice?.trim() ?? "";
  if (!VOICE_ID_PATTERN.test(voiceId)) {
    await updateEmployeeRow({
      employeeId: input.employeeId,
      userId: input.userId,
      config: {
        avatarRenderStatus: "failed",
        avatarPreviewError:
          "Set a valid ElevenLabs voice_id in workspace settings for identity audio.",
      },
    });
    return {
      ok: false,
      error:
        "Configure an ElevenLabs voice in workspace settings (voice_id required).",
      httpStatus: 400,
    };
  }

  const languageCode = elevenLabsLanguageCodeFromWorkspaceLanguage(
    settings?.language,
  );
  const modelId = ELEVENLABS_TTS_MODEL_IDS[0]!;

  let audioUrl: string;
  try {
    const audioBuf = await synthesizeElevenLabsTtsMp3({
      apiKey,
      voiceId,
      modelId,
      text: segmentText,
      languageCode,
    });
    const { url } = await storeAvatarSessionAudioMp3(
      input.userId,
      Buffer.from(audioBuf),
    );
    audioUrl = url;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "TTS failed";
    await updateEmployeeRow({
      employeeId: input.employeeId,
      userId: input.userId,
      config: {
        avatarRenderStatus: "failed",
        avatarPreviewError: msg,
      },
    });
    return { ok: false, error: msg, httpStatus: 502 };
  }

  const runpodKey = process.env.RUNPOD_API_KEY!.trim();
  const sync = await runInfiniteTalkSync({
    apiKey: runpodKey,
    prompt: infinitePrompt,
    imageUrl,
    audioUrl,
    size: SIZE,
  });

  if (!sync.ok) {
    await updateEmployeeRow({
      employeeId: input.employeeId,
      userId: input.userId,
      config: {
        avatarRenderStatus: "failed",
        avatarPreviewError: sync.error,
      },
    });
    return { ok: false, error: sync.error, httpStatus: 502 };
  }

  let blobVideoUrl: string;
  try {
    const { url } = await persistRemoteAvatarVideoMp4({
      userId: input.userId,
      sourceUrl: sync.videoUrl,
      filenamePrefix: `identity-${input.employeeId}`,
    });
    blobVideoUrl = url;
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Failed to persist identity video";
    await updateEmployeeRow({
      employeeId: input.employeeId,
      userId: input.userId,
      config: {
        avatarRenderStatus: "failed",
        avatarPreviewError: msg,
      },
    });
    return { ok: false, error: msg, httpStatus: 502 };
  }

  const nowIso = new Date().toISOString();
  await updateEmployeeRow({
    employeeId: input.employeeId,
    userId: input.userId,
    config: {
      videoPreviewUrl: blobVideoUrl,
      identityReferenceImageUrl: imageUrl,
      avatarRenderStatus: "ready",
      avatarPreviewJobId: null,
      avatarPreviewError: null,
      identityClipGeneratedAt: nowIso,
      identityClipEngine: "infinitetalk",
      identityClipInputHash: inputHash,
      identityClipPromptTemplateVersion: promptTemplateVersion,
      promptTemplateVersion,
    },
  });

  return { ok: true, videoUrl: blobVideoUrl, cached: false };
}
