import { eq } from "drizzle-orm";

import type { SettingsDTO } from "@/features/settings/types";
import { getCurrentSession } from "@/lib/auth/session.server";
import {
  isPolarEnterpriseCheckoutConfigured,
  isPolarPortalConfigured,
  isPolarProCheckoutConfigured,
} from "@/lib/billing/polar-env";
import { getPlanForUser } from "@/services/db/repositories/billing.repository";
import { getSettingsForUser } from "@/services/db/repositories/settings.repository";
import { getUsageForUser } from "@/services/db/repositories/usage.repository";
import { listActiveApiKeysForUser } from "@/services/db/repositories/user-api-key.repository";
import { getSecuritySessionsDto } from "@/lib/auth/sessions.server";
import { db } from "@/services/db/client";
import { user } from "@/db/schema";

function mapRowToDtoParts(row: NonNullable<Awaited<ReturnType<typeof getSettingsForUser>>>) {
  return {
    aiDefaults: {
      tone: row.tone,
      language: row.language,
      voiceEnabled: row.voiceEnabled,
      latencyVsQuality: row.latencyVsQuality,
    },
    arachne: {
      streaming: row.streaming,
      avatarQuality: row.avatarQuality,
      ttsVoice: row.ttsVoice,
      sttModel: row.sttModel,
    },
  };
}

/**
 * Full settings surface for `/settings` — account, plan/usage, AI prefs.
 */
export async function getSettingsDTO(): Promise<SettingsDTO | null> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return null;

  const [u] = await db
    .select({
      name: user.name,
      email: user.email,
      image: user.image,
      organization: user.organization,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!u) return null;

  const settingsRow = await getSettingsForUser(userId);
  const plan = await getPlanForUser(userId);
  const usage = await getUsageForUser(userId);
  const [sessions, keyRows] = await Promise.all([
    getSecuritySessionsDto(),
    listActiveApiKeysForUser(userId),
  ]);

  const defaults = {
    tone: "formal",
    language: "en",
    voiceEnabled: true,
    latencyVsQuality: 62,
    streaming: true,
    avatarQuality: "high",
    ttsVoice: "nova",
    sttModel: "whisper-large",
  };

  const merged = settingsRow
    ? mapRowToDtoParts(settingsRow)
    : {
        aiDefaults: {
          tone: defaults.tone,
          language: defaults.language,
          voiceEnabled: defaults.voiceEnabled,
          latencyVsQuality: defaults.latencyVsQuality,
        },
        arachne: {
          streaming: defaults.streaming,
          avatarQuality: defaults.avatarQuality,
          ttsVoice: defaults.ttsVoice,
          sttModel: defaults.sttModel,
        },
      };

  return {
    account: {
      name: u.name,
      email: u.email,
      image: u.image ?? null,
      organization: u.organization?.trim() ? u.organization.trim() : null,
    },
    billing: {
      planType: plan.name,
      planLabel: plan.label,
      sessionsUsed: usage.sessionsUsed,
      sessionsLimit: plan.limits.sessions,
      tokensUsed: usage.tokensUsed,
      tokensLimit: plan.limits.tokens,
      polarProCheckoutEnabled: isPolarProCheckoutConfigured(),
      polarEnterpriseCheckoutEnabled: isPolarEnterpriseCheckoutConfigured(),
      polarPortalEnabled: isPolarPortalConfigured(),
    },
    aiDefaults: merged.aiDefaults,
    arachne: merged.arachne,
    security: {
      sessions,
      apiKeys: keyRows.map((k) => ({
        id: k.id,
        prefix: k.prefix,
        name: k.name,
        createdAt: k.createdAt.toISOString(),
        lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      })),
    },
  };
}
