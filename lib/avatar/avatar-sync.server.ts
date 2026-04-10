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
} from "@/services/db/repositories/employees.repository";

import { isIdentityClipInfrastructureConfigured } from "@/lib/avatar/identity-clip-env.server";

const VOICE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
const SYNC_PROMPT_SUFFIX = " realistic, professional, clean lighting";
const SIZE = "480p" as const;
const MAX_TEXT = 4000;

function resolveSyncImageUrl(cfg: EmployeeConfigJson): string | null {
  const identity =
    typeof cfg.identityReferenceImageUrl === "string"
      ? cfg.identityReferenceImageUrl.trim()
      : "";
  if (/^https?:\/\//i.test(identity)) return identity;
  const ph =
    typeof cfg.avatarPlaceholder === "string" ? cfg.avatarPlaceholder.trim() : "";
  if (/^https?:\/\//i.test(ph)) return ph;
  return null;
}

export function buildAvatarSyncInfiniteTalkPrompt(
  baseBehaviorPrompt: string,
  text: string,
): string {
  const base = baseBehaviorPrompt.trim() || "Professional digital assistant.";
  const t = text.trim().slice(0, MAX_TEXT);
  if (!t) return `${base} speaking naturally to camera${SYNC_PROMPT_SUFFIX}`;
  return `${base} speaking: ${t}${SYNC_PROMPT_SUFFIX}`;
}

/**
 * One response: ElevenLabs audio (source of truth) + optional InfiniteTalk video on Blob.
 * Does not mutate employee identity / preview config.
 */
export async function runAvatarSyncClip(input: {
  userId: string;
  employeeId: string;
  text: string;
}): Promise<
  | { ok: true; audioUrl: string; videoUrl: string | null }
  | { ok: false; error: string; httpStatus: number }
> {
  if (!isIdentityClipInfrastructureConfigured()) {
    return {
      ok: false,
      error:
        "Sync avatar is not configured (RUNPOD_API_KEY, ELEVENLABS_API_KEY, BLOB_READ_WRITE_TOKEN).",
      httpStatus: 503,
    };
  }

  const segmentText = input.text.trim().slice(0, MAX_TEXT);
  if (!segmentText) {
    return { ok: false, error: "text is required", httpStatus: 400 };
  }

  const row = await getEmployeeRowById(input.employeeId, input.userId);
  if (!row) {
    return { ok: false, error: "Employee not found", httpStatus: 404 };
  }

  const cfg = (row.config ?? {}) as EmployeeConfigJson;
  const imageUrl = resolveSyncImageUrl(cfg);
  if (!imageUrl) {
    return {
      ok: false,
      error:
        "No public https reference image (identityReferenceImageUrl or https avatarPlaceholder).",
      httpStatus: 400,
    };
  }

  const promptCtx = buildEmployeeAvatarPromptContext({
    name: row.name,
    roleColumn: row.role,
    config: cfg,
  });
  buildEmployeeAvatarPrompts(promptCtx);
  const behaviorBase =
    typeof cfg.prompt === "string" && cfg.prompt.trim() ? cfg.prompt : "";
  const infinitePrompt = buildAvatarSyncInfiniteTalkPrompt(
    behaviorBase,
    segmentText,
  );

  const apiKey = process.env.ELEVENLABS_API_KEY!.trim();
  const settings = await getSettingsForUser(input.userId);
  const voiceId = settings?.ttsVoice?.trim() ?? "";
  if (!VOICE_ID_PATTERN.test(voiceId)) {
    return {
      ok: false,
      error:
        "Set a valid ElevenLabs voice_id in workspace settings for sync-mode TTS.",
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
    return {
      ok: false,
      error: e instanceof Error ? e.message : "TTS failed",
      httpStatus: 502,
    };
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
    return { ok: true, audioUrl, videoUrl: null };
  }

  try {
    const { url } = await persistRemoteAvatarVideoMp4({
      userId: input.userId,
      sourceUrl: sync.videoUrl,
      filenamePrefix: `sync-${input.employeeId}`,
    });
    return { ok: true, audioUrl, videoUrl: url };
  } catch {
    return { ok: true, audioUrl, videoUrl: null };
  }
}
