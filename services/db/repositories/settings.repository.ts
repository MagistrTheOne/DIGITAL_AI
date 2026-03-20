import { eq } from "drizzle-orm";

import { db } from "@/db";
import { userSettings } from "@/db/schema";

export type UserSettingsPatch = {
  tone?: string;
  language?: string;
  voiceEnabled?: boolean;
  latencyVsQuality?: number;
  streaming?: boolean;
  avatarQuality?: string;
  ttsVoice?: string;
  sttModel?: string;
};

const DEFAULTS = {
  tone: "formal",
  language: "en",
  voiceEnabled: true,
  latencyVsQuality: 62,
  streaming: true,
  avatarQuality: "high",
  ttsVoice: "nova",
  sttModel: "whisper-large",
} as const;

export type UserSettingsRecord = typeof userSettings.$inferSelect;

export async function getSettingsForUser(
  userId: string,
): Promise<UserSettingsRecord | null> {
  if (!userId) return null;
  try {
    const [row] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);
    return row ?? null;
  } catch {
    return null;
  }
}

export async function upsertSettings(
  userId: string,
  patch: UserSettingsPatch,
): Promise<void> {
  const existing = await getSettingsForUser(userId);
  const now = new Date();

  const row = {
    userId,
    tone: patch.tone ?? existing?.tone ?? DEFAULTS.tone,
    language: patch.language ?? existing?.language ?? DEFAULTS.language,
    voiceEnabled:
      patch.voiceEnabled ?? existing?.voiceEnabled ?? DEFAULTS.voiceEnabled,
    latencyVsQuality:
      patch.latencyVsQuality ??
      existing?.latencyVsQuality ??
      DEFAULTS.latencyVsQuality,
    streaming: patch.streaming ?? existing?.streaming ?? DEFAULTS.streaming,
    avatarQuality:
      patch.avatarQuality ?? existing?.avatarQuality ?? DEFAULTS.avatarQuality,
    ttsVoice: patch.ttsVoice ?? existing?.ttsVoice ?? DEFAULTS.ttsVoice,
    sttModel: patch.sttModel ?? existing?.sttModel ?? DEFAULTS.sttModel,
    updatedAt: now,
  };

  await db
    .insert(userSettings)
    .values(row)
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: {
        tone: row.tone,
        language: row.language,
        voiceEnabled: row.voiceEnabled,
        latencyVsQuality: row.latencyVsQuality,
        streaming: row.streaming,
        avatarQuality: row.avatarQuality,
        ttsVoice: row.ttsVoice,
        sttModel: row.sttModel,
        updatedAt: now,
      },
    });
}
