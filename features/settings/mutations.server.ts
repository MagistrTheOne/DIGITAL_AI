"use server";

import type {
  UpdateAiDefaultsInput,
  UpdateArachneInput,
} from "@/features/settings/types";
import { getCurrentSession } from "@/lib/auth/session.server";
import { upsertSettings } from "@/services/db/repositories/settings.repository";

export async function updateAiDefaults(
  input: UpdateAiDefaultsInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Unauthorized" };

  const patch: Parameters<typeof upsertSettings>[1] = {};
  if (input.tone !== undefined) patch.tone = input.tone;
  if (input.language !== undefined) patch.language = input.language;
  if (input.voiceEnabled !== undefined) patch.voiceEnabled = input.voiceEnabled;
  if (input.latencyVsQuality !== undefined) {
    const n = Number(input.latencyVsQuality);
    if (Number.isFinite(n)) {
      patch.latencyVsQuality = Math.min(100, Math.max(0, Math.round(n)));
    }
  }

  try {
    await upsertSettings(userId, patch);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save settings." };
  }
}

export async function updateArachneSettings(
  input: UpdateArachneInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Unauthorized" };

  const patch: Parameters<typeof upsertSettings>[1] = {};
  if (input.streaming !== undefined) patch.streaming = input.streaming;
  if (input.avatarQuality !== undefined) patch.avatarQuality = input.avatarQuality;
  if (input.ttsVoice !== undefined) patch.ttsVoice = input.ttsVoice;
  if (input.sttModel !== undefined) patch.sttModel = input.sttModel;

  try {
    await upsertSettings(userId, patch);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save settings." };
  }
}
