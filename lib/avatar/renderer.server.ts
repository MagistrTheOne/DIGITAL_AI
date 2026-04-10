import {
  buildEmployeeAvatarPromptContext,
  buildInfiniteTalkPrompt,
  buildSessionSegmentT2vPrompts,
} from "@/lib/inference/build-employee-avatar-prompt.server";
import { enqueueArachneSessionT2vJob } from "@/lib/inference/runpod-avatar-arachne-session.server";
import { enqueueTalkingHeadAvatarJob } from "@/lib/inference/runpod-avatar-talking-head.server";
import {
  isInfiniteTalkApiAvailable,
  runInfiniteTalkSync,
} from "@/lib/inference/runpod-infinitetalk.server";
import { isRunPodTalkingHeadConfigured } from "@/lib/inference/runpod-avatar-talking-head.server";
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
import {
  countInFlightAvatarJobsForSession,
  findAvatarRenderJobBySessionSequenceTier,
  insertAvatarRenderJob,
  type RunpodEndpointKey,
} from "@/services/db/repositories/avatar-render-jobs.repository";

import {
  normalizeAvatarEngine,
  type AvatarEngine,
  type AvatarRenderJobStatus,
  type AvatarRenderRequestBody,
  type AvatarVideoTier,
} from "@/lib/avatar/types";
import { isAvatarRenderPipelineEnvEnabled } from "@/lib/avatar/pipeline-env.server";

import { and, eq } from "drizzle-orm";
import { db } from "@/services/db/client";
import { avatarRenderJob } from "@/db/schema";

const VOICE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
const MAX_IN_FLIGHT_PER_SESSION = 2;

function normalizeEngine(v: string | undefined): AvatarEngine {
  if (
    v === "arachne_t2v" ||
    v === "sadtalker" ||
    v === "ditto" ||
    v === "infinitetalk"
  ) {
    return v;
  }
  return "ditto";
}

/**
 * Default realtime leg: InfiniteTalk public runsync when `RUNPOD_API_KEY` is set,
 * unless `AVATAR_REALTIME_ENGINE=ditto_worker` and a custom Ditto endpoint is configured.
 * Explicit `engine: "ditto"` forces the custom worker.
 */
function pickRealtimeBackend(requested?: AvatarEngine): "infinitetalk" | "talking_head" {
  if (requested === "infinitetalk") return "infinitetalk";
  if (requested === "ditto" || requested === "sadtalker") {
    return "talking_head";
  }
  const pref = process.env.AVATAR_REALTIME_ENGINE?.trim().toLowerCase();
  if (
    (pref === "ditto" || pref === "ditto_worker" || pref === "worker") &&
    isRunPodTalkingHeadConfigured()
  ) {
    return "talking_head";
  }
  if (isInfiniteTalkApiAvailable()) return "infinitetalk";
  if (isRunPodTalkingHeadConfigured()) return "talking_head";
  return "infinitetalk";
}

function resolveReferenceImageUrl(cfg: EmployeeConfigJson): string | null {
  const identity =
    typeof cfg.identityReferenceImageUrl === "string"
      ? cfg.identityReferenceImageUrl.trim()
      : "";
  if (/^https?:\/\//i.test(identity)) return identity;
  const ph =
    typeof cfg.avatarPlaceholder === "string" ? cfg.avatarPlaceholder.trim() : "";
  if (/^https?:\/\//i.test(ph)) return ph;
  const video =
    typeof cfg.videoPreviewUrl === "string" ? cfg.videoPreviewUrl.trim() : "";
  if (/^https?:\/\//i.test(video)) return video;
  return null;
}

function t2vParamsFromRenderProfile(
  cfg: EmployeeConfigJson,
): {
  width?: number;
  height?: number;
  numFrames?: number;
  numInferenceSteps?: number;
  textGuidanceScale?: number;
} {
  const rp = cfg.renderProfile;
  if (!rp || typeof rp !== "object") return {};
  const o = rp as Record<string, unknown>;
  const num = (k: string) =>
    typeof o[k] === "number" && Number.isFinite(o[k]!) ? (o[k] as number) : undefined;
  return {
    width: num("width"),
    height: num("height"),
    numFrames: num("num_frames") ?? num("numFrames"),
    numInferenceSteps: num("num_inference_steps") ?? num("numInferenceSteps"),
    textGuidanceScale: num("text_guidance_scale") ?? num("textGuidanceScale"),
  };
}

async function ensurePublicAudioUrl(input: {
  userId: string;
  audioUrl?: string;
  text?: string;
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const raw = input.audioUrl?.trim();
  if (raw && /^https?:\/\//i.test(raw)) return { ok: true, url: raw };

  const t = input.text?.trim();
  if (!t) {
    return {
      ok: false,
      error: "Provide audioUrl or text for talking-head rendering.",
    };
  }

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      error:
        "ELEVENLABS_API_KEY is not configured; pass a public audioUrl for this segment.",
    };
  }

  const settings = await getSettingsForUser(input.userId);
  const voiceId = settings?.ttsVoice?.trim() ?? "";
  if (!VOICE_ID_PATTERN.test(voiceId)) {
    return {
      ok: false,
      error:
        "Set an ElevenLabs voice_id in workspace settings, or pass audioUrl.",
    };
  }

  const languageCode = elevenLabsLanguageCodeFromWorkspaceLanguage(
    settings?.language,
  );
  const modelId = ELEVENLABS_TTS_MODEL_IDS[0]!;

  try {
    const audio = await synthesizeElevenLabsTtsMp3({
      apiKey,
      voiceId,
      modelId,
      text: t.slice(0, 4000),
      languageCode,
    });
    const buf = Buffer.from(audio);
    const { url } = await storeAvatarSessionAudioMp3(input.userId, buf);
    return { ok: true, url };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "TTS synthesis failed",
    };
  }
}

async function removeFailedJobIfAny(
  userId: string,
  sessionId: string,
  sequence: number,
  videoTier: string,
) {
  const existing = await findAvatarRenderJobBySessionSequenceTier({
    userId,
    sessionId,
    sequence,
    videoTier,
  });
  if (existing?.status === "failed") {
    await db
      .delete(avatarRenderJob)
      .where(
        and(
          eq(avatarRenderJob.id, existing.id),
          eq(avatarRenderJob.userId, userId),
        ),
      );
  }
}

function rowToJobPayload(row: {
  id: string;
  videoTier: string;
  engineRequested: string;
  status: string;
}): {
  jobId: string;
  videoTier: AvatarVideoTier;
  engine: AvatarEngine;
  status: AvatarRenderJobStatus;
} {
  const tier: AvatarVideoTier =
    row.videoTier === "enhanced" ? "enhanced" : "realtime";
  const eng = normalizeEngine(row.engineRequested);
  const st: AvatarRenderJobStatus =
    row.status === "ready" ||
    row.status === "failed" ||
    row.status === "queued" ||
    row.status === "processing"
      ? row.status
      : "queued";
  return {
    jobId: row.id,
    videoTier: tier,
    engine: eng,
    status: st,
  };
}

export async function enqueueAvatarRenderJobs(input: {
  userId: string;
  body: AvatarRenderRequestBody;
}): Promise<
  | {
      ok: true;
      jobs: Array<{
        jobId: string;
        videoTier: AvatarVideoTier;
        engine: AvatarEngine;
        status: AvatarRenderJobStatus;
      }>;
    }
  | { ok: false; error: string; httpStatus: number }
> {
  if (!isAvatarRenderPipelineEnvEnabled()) {
    return {
      ok: false,
      error: "Avatar render pipeline is not configured (RunPod session endpoints).",
      httpStatus: 503,
    };
  }

  const employeeId = input.body.employeeId?.trim();
  if (!employeeId) {
    return { ok: false, error: "employeeId is required", httpStatus: 400 };
  }

  const sessionId = input.body.sessionId?.trim();
  if (!sessionId) {
    return { ok: false, error: "sessionId is required", httpStatus: 400 };
  }

  const sequence = input.body.sequence;
  if (!Number.isFinite(sequence) || sequence < 0) {
    return { ok: false, error: "sequence must be a non-negative number", httpStatus: 400 };
  }

  const row = await getEmployeeRowById(employeeId, input.userId);
  if (!row) {
    return { ok: false, error: "Employee not found", httpStatus: 404 };
  }

  const cfg = (row.config ?? {}) as EmployeeConfigJson;
  const engineTag = normalizeAvatarEngine(input.body.engine);
  const hybrid =
    Boolean(input.body.hybridEnhance) && engineTag !== "arachne_t2v";

  const inFlight = await countInFlightAvatarJobsForSession({
    userId: input.userId,
    sessionId,
  });
  if (inFlight >= MAX_IN_FLIGHT_PER_SESSION) {
    return {
      ok: false,
      error: "Too many avatar jobs in flight for this session. Try again shortly.",
      httpStatus: 429,
    };
  }

  const jobsOut: Array<{
    jobId: string;
    videoTier: AvatarVideoTier;
    engine: AvatarEngine;
    status: AvatarRenderJobStatus;
  }> = [];

  const promptCtx = buildEmployeeAvatarPromptContext({
    name: row.name,
    roleColumn: row.role,
    config: cfg,
  });

  /** --- arachne_t2v only --- */
  if (engineTag === "arachne_t2v") {
    const segmentText = input.body.text?.trim() ?? "";
    if (!segmentText) {
      return {
        ok: false,
        error: "text is required for arachne_t2v engine",
        httpStatus: 400,
      };
    }

    await removeFailedJobIfAny(
      input.userId,
      sessionId,
      sequence,
      "enhanced",
    );

    const existing = await findAvatarRenderJobBySessionSequenceTier({
      userId: input.userId,
      sessionId,
      sequence,
      videoTier: "enhanced",
    });
    if (existing && existing.status !== "failed") {
      jobsOut.push(rowToJobPayload(existing));
      return { ok: true, jobs: jobsOut };
    }

    const prompts = buildSessionSegmentT2vPrompts(promptCtx, segmentText);
    const t2vExtra = t2vParamsFromRenderProfile(cfg);
    const enq = await enqueueArachneSessionT2vJob({
      ...prompts,
      ...t2vExtra,
      sessionId,
      sequence,
      employeeId,
    });
    if (!enq.ok) {
      return { ok: false, error: enq.error, httpStatus: 502 };
    }

    const inserted = await insertAvatarRenderJob({
      userId: input.userId,
      employeeId,
      sessionId,
      sequence,
      engineRequested: "arachne_t2v",
      videoTier: "enhanced",
      parentJobId: null,
      runpodEndpointKey: "arachne_t2v",
      runpodJobId: enq.runpodJobId,
    });
    jobsOut.push(rowToJobPayload(inserted));
    return { ok: true, jobs: jobsOut };
  }

  /** --- ditto (+ optional hybrid ARACHNE) --- */
  const audio = await ensurePublicAudioUrl({
    userId: input.userId,
    audioUrl: input.body.audioUrl,
    text: input.body.text,
  });
  if (!audio.ok) {
    return { ok: false, error: audio.error, httpStatus: 400 };
  }

  const imageUrl =
    input.body.imageUrl?.trim() ||
    resolveReferenceImageUrl(cfg) ||
    "";
  if (!/^https?:\/\//i.test(imageUrl)) {
    return {
      ok: false,
      error:
        "No reference image/video URL: set employee preview video URL, avatar image URL, or pass imageUrl.",
      httpStatus: 400,
    };
  }

  await removeFailedJobIfAny(
    input.userId,
    sessionId,
    sequence,
    "realtime",
  );

  let realtimeParent: Awaited<ReturnType<typeof findAvatarRenderJobBySessionSequenceTier>> =
    await findAvatarRenderJobBySessionSequenceTier({
      userId: input.userId,
      sessionId,
      sequence,
      videoTier: "realtime",
    });

  if (realtimeParent && realtimeParent.status !== "failed") {
    jobsOut.push(rowToJobPayload(realtimeParent));
  } else {
    const backend = pickRealtimeBackend(engineTag);
    let newRow: Awaited<ReturnType<typeof insertAvatarRenderJob>> | null = null;

    if (backend === "infinitetalk") {
      const apiKey = process.env.RUNPOD_API_KEY?.trim();
      if (apiKey) {
        const segmentText = input.body.text?.trim() ?? "";
        const itPrompt = buildInfiniteTalkPrompt(promptCtx, segmentText);
        const size =
          process.env.RUNPOD_INFINITETALK_SIZE?.trim() === "720p"
            ? "720p"
            : "480p";
        const sync = await runInfiniteTalkSync({
          apiKey,
          prompt: itPrompt,
          imageUrl,
          audioUrl: audio.url,
          size,
        });
        if (sync.ok) {
          try {
            const { url } = await persistRemoteAvatarVideoMp4({
              userId: input.userId,
              sourceUrl: sync.videoUrl,
              filenamePrefix: `e${employeeId}-s${sequence}`,
            });
            newRow = await insertAvatarRenderJob({
              userId: input.userId,
              employeeId,
              sessionId,
              sequence,
              engineRequested: "infinitetalk",
              videoTier: "realtime",
              parentJobId: null,
              runpodEndpointKey: "infinitetalk",
              runpodJobId: sync.runpodId,
              initial: {
                status: "ready",
                progress: 100,
                videoUrl: url,
                engineUsed: "infinitetalk",
              },
            });
          } catch {
            newRow = null;
          }
        }
      }
    }

    if (!newRow) {
      const enqDitto = await enqueueTalkingHeadAvatarJob({
        audioUrl: audio.url,
        imageUrl,
        sessionId,
        sequence,
        employeeId,
      });
      if (!enqDitto.ok) {
        return { ok: false, error: enqDitto.error, httpStatus: 502 };
      }
      newRow = await insertAvatarRenderJob({
        userId: input.userId,
        employeeId,
        sessionId,
        sequence,
        engineRequested: "ditto",
        videoTier: "realtime",
        parentJobId: null,
        runpodEndpointKey: "talking_head",
        runpodJobId: enqDitto.runpodJobId,
      });
    }

    realtimeParent = newRow;
    jobsOut.push(rowToJobPayload(realtimeParent));
  }

  if (hybrid) {
    const segmentText = input.body.text?.trim() ?? "";
    if (!segmentText) {
      return {
        ok: false,
        error: "hybridEnhance requires text (for cinematic prompt)",
        httpStatus: 400,
      };
    }

    await removeFailedJobIfAny(
      input.userId,
      sessionId,
      sequence,
      "enhanced",
    );

    const existingEn = await findAvatarRenderJobBySessionSequenceTier({
      userId: input.userId,
      sessionId,
      sequence,
      videoTier: "enhanced",
    });
    if (existingEn && existingEn.status !== "failed") {
      jobsOut.push(rowToJobPayload(existingEn));
      return { ok: true, jobs: jobsOut };
    }

    const prompts = buildSessionSegmentT2vPrompts(promptCtx, segmentText);
    const t2vExtra = t2vParamsFromRenderProfile(cfg);
    const enqA = await enqueueArachneSessionT2vJob({
      ...prompts,
      ...t2vExtra,
      sessionId,
      sequence,
      employeeId,
    });
    if (!enqA.ok) {
      return { ok: false, error: enqA.error, httpStatus: 502 };
    }

    const enhancedRow = await insertAvatarRenderJob({
      userId: input.userId,
      employeeId,
      sessionId,
      sequence,
      engineRequested: "arachne_t2v",
      videoTier: "enhanced",
      parentJobId: realtimeParent?.id ?? null,
      runpodEndpointKey: "arachne_t2v",
      runpodJobId: enqA.runpodJobId,
    });
    jobsOut.push(rowToJobPayload(enhancedRow));
  }

  return { ok: true, jobs: jobsOut };
}
