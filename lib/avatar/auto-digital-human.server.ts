import {
  buildEmployeeAvatarPromptContext,
  buildEmployeeAvatarPrompts,
} from "@/lib/inference/build-employee-avatar-prompt.server";
import { generateDigitalHumanPortraitPng } from "@/lib/inference/openai-digital-human-portrait.server";
import { runInfiniteTalkSync } from "@/lib/inference/runpod-infinitetalk.server";
import { ELEVENLABS_TTS_MODEL_IDS } from "@/lib/inference/runtime-catalog.constants";
import {
  elevenLabsLanguageCodeFromWorkspaceLanguage,
  synthesizeElevenLabsTtsMp3,
} from "@/lib/inference/providers/elevenlabs-tts.server";
import { persistRemoteAvatarVideoMp4 } from "@/lib/storage/avatar-generated-video.server";
import { storeAvatarSessionAudioMp3 } from "@/lib/storage/avatar-session-media.server";
import { storeDigitalHumanPortraitPng } from "@/lib/storage/digital-human-portrait.server";
import { getSettingsForUser } from "@/services/db/repositories/settings.repository.server";
import {
  getEmployeeRowById,
  type EmployeeConfigJson,
  updateEmployeeRow,
} from "@/services/db/repositories/employees.repository";

import { buildIdentityClipInfiniteTalkPrompt } from "@/lib/avatar/identity-clip.server";

const VOICE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
const DEFAULT_INTRO_TEXT =
  "Hello. I'm your digital colleague and I'm here to help.";
const LOCK_STALE_MS = 45 * 60 * 1000;
const SIZE = "480p" as const;

function isHttps(u: string | null | undefined): boolean {
  return typeof u === "string" && /^https?:\/\//i.test(u.trim());
}

function initialReferenceImageUrl(cfg: EmployeeConfigJson): string | null {
  if (isHttps(cfg.identityReferenceImageUrl)) {
    return cfg.identityReferenceImageUrl!.trim();
  }
  if (isHttps(cfg.avatarPlaceholder)) {
    return cfg.avatarPlaceholder!.trim();
  }
  return null;
}

function fallbackImageUrlFromEnv(): string | null {
  const raw = process.env.NULLXES_AUTO_AVATAR_FALLBACK_IMAGE_URL?.trim();
  return raw && isHttps(raw) ? raw.trim() : null;
}

/**
 * Non-blocking post-create: portrait (once) + intro TTS + InfiniteTalk + Blob video.
 * Skips if `videoPreviewUrl` already set or another run is in progress (unless lock stale).
 */
export async function runAutoDigitalHumanPipeline(input: {
  employeeId: string;
  userId: string;
}): Promise<void> {
  const row = await getEmployeeRowById(input.employeeId, input.userId);
  if (!row) return;

  let cfg = (row.config ?? {}) as EmployeeConfigJson;

  if (isHttps(cfg.videoPreviewUrl ?? null)) {
    return;
  }

  const startedAt = cfg.autoDigitalHumanRunStartedAt?.trim();
  if (startedAt) {
    const t = Date.parse(startedAt);
    if (Number.isFinite(t) && Date.now() - t < LOCK_STALE_MS) {
      return;
    }
  }

  const nowIso = new Date().toISOString();
  const hadRefImage = Boolean(initialReferenceImageUrl(cfg));
  await updateEmployeeRow({
    employeeId: input.employeeId,
    userId: input.userId,
    config: {
      autoDigitalHumanRunStartedAt: nowIso,
      avatarRenderStatus: "generating",
      avatarPreviewError: null,
      avatarRenderStage: hadRefImage ? "voice" : "face",
    },
  });

  const avatarPlaceholder =
    typeof cfg.avatarPlaceholder === "string" ? cfg.avatarPlaceholder : "";

  let imageUrl: string | null = isHttps(cfg.identityReferenceImageUrl ?? null)
    ? cfg.identityReferenceImageUrl!.trim()
    : isHttps(cfg.avatarPlaceholder ?? null)
      ? cfg.avatarPlaceholder!.trim()
      : null;

  try {
    if (!imageUrl) {
      const apiKey = process.env.OPENAI_API_KEY!.trim();
      const gen = await generateDigitalHumanPortraitPng({
        apiKey,
        avatarPlaceholder,
      });

      if (gen.ok) {
        const { url } = await storeDigitalHumanPortraitPng({
          userId: input.userId,
          employeeId: input.employeeId,
          png: gen.png,
        });
        imageUrl = url;
        await updateEmployeeRow({
          employeeId: input.employeeId,
          userId: input.userId,
          config: {
            identityReferenceImageUrl: url,
            avatarRenderStage: "voice",
          },
        });
      } else {
        const fb = fallbackImageUrlFromEnv();
        if (fb) {
          imageUrl = fb;
          await updateEmployeeRow({
            employeeId: input.employeeId,
            userId: input.userId,
            config: {
              identityReferenceImageUrl: fb,
              avatarRenderStage: "voice",
            },
          });
        } else {
          await updateEmployeeRow({
            employeeId: input.employeeId,
            userId: input.userId,
            config: {
              avatarRenderStatus: "failed",
              avatarPreviewError: `Portrait: ${gen.error}`,
              autoDigitalHumanRunStartedAt: null,
              avatarRenderStage: null,
            },
          });
          return;
        }
      }
    }

    if (!imageUrl) {
      await updateEmployeeRow({
        employeeId: input.employeeId,
        userId: input.userId,
        config: {
          avatarRenderStatus: "failed",
          avatarPreviewError: "No reference image URL for video step.",
          autoDigitalHumanRunStartedAt: null,
          avatarRenderStage: null,
        },
      });
      return;
    }

    cfg = { ...cfg, identityReferenceImageUrl: imageUrl };
    await updateEmployeeRow({
      employeeId: input.employeeId,
      userId: input.userId,
      config: {
        identityReferenceImageUrl: imageUrl,
        avatarRenderStage: "voice",
      },
    });

    const settings = await getSettingsForUser(input.userId);
    const voiceId = settings?.ttsVoice?.trim() ?? "";
    if (!VOICE_ID_PATTERN.test(voiceId)) {
      await updateEmployeeRow({
        employeeId: input.employeeId,
        userId: input.userId,
        config: {
          avatarRenderStatus: "failed",
          avatarPreviewError:
            "Set ElevenLabs voice_id in workspace settings to finish auto avatar video.",
          autoDigitalHumanRunStartedAt: null,
          avatarRenderStage: null,
        },
      });
      return;
    }

    const languageCode = elevenLabsLanguageCodeFromWorkspaceLanguage(
      settings?.language,
    );
    const modelId = ELEVENLABS_TTS_MODEL_IDS[0]!;
    const elevenKey = process.env.ELEVENLABS_API_KEY!.trim();

    const audioBuf = await synthesizeElevenLabsTtsMp3({
      apiKey: elevenKey,
      voiceId,
      modelId,
      text: DEFAULT_INTRO_TEXT,
      languageCode,
    });
    const { url: audioUrl } = await storeAvatarSessionAudioMp3(
      input.userId,
      Buffer.from(audioBuf),
    );

    await updateEmployeeRow({
      employeeId: input.employeeId,
      userId: input.userId,
      config: { avatarRenderStage: "video" },
    });

    const promptCtx = buildEmployeeAvatarPromptContext({
      name: row.name,
      roleColumn: row.role,
      config: cfg,
    });
    const behaviorBase =
      typeof cfg.prompt === "string" && cfg.prompt.trim() ? cfg.prompt : "";
    const infinitePrompt = buildIdentityClipInfiniteTalkPrompt(
      behaviorBase,
      DEFAULT_INTRO_TEXT,
    );
    const { promptTemplateVersion } = buildEmployeeAvatarPrompts(promptCtx);

    const sync = await runInfiniteTalkSync({
      apiKey: process.env.RUNPOD_API_KEY!.trim(),
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
          autoDigitalHumanRunStartedAt: null,
          avatarRenderStage: null,
        },
      });
      return;
    }

    const { url: blobVideoUrl } = await persistRemoteAvatarVideoMp4({
      userId: input.userId,
      sourceUrl: sync.videoUrl,
      filenamePrefix: `auto-dh-${input.employeeId}`,
    });

    const clipNow = new Date().toISOString();

    await updateEmployeeRow({
      employeeId: input.employeeId,
      userId: input.userId,
      config: {
        videoPreviewUrl: blobVideoUrl,
        identityReferenceImageUrl: imageUrl,
        avatarRenderStatus: "ready",
        avatarPreviewJobId: null,
        avatarPreviewError: null,
        identityClipGeneratedAt: clipNow,
        identityClipEngine: "infinitetalk",
        identityClipPromptTemplateVersion: promptTemplateVersion,
        promptTemplateVersion,
        autoDigitalHumanRunStartedAt: null,
        avatarRenderStage: null,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Auto digital-human pipeline failed";
    await updateEmployeeRow({
      employeeId: input.employeeId,
      userId: input.userId,
      config: {
        avatarRenderStatus: "failed",
        avatarPreviewError: msg,
        autoDigitalHumanRunStartedAt: null,
        avatarRenderStage: null,
      },
    });
  }
}
