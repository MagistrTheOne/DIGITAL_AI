import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/session.server";
import {
  ELEVENLABS_TTS_MODEL_IDS,
  isAllowedElevenLabsTtsModelId,
} from "@/lib/inference/runtime-catalog.constants";
import {
  elevenLabsLanguageCodeFromWorkspaceLanguage,
  synthesizeElevenLabsTtsMp3,
} from "@/lib/inference/providers/elevenlabs-tts.server";
import { getSettingsForUser } from "@/services/db/repositories/settings.repository";

export const runtime = "nodejs";

const DEFAULT_TEXT_EN =
  "Hello from NULLXES. This is a short ElevenLabs voice preview for your avatar.";

const DEFAULT_TEXT_RU =
  "Здравствуйте, это NULLXES. Короткий тест голоса ElevenLabs для вашего аватара.";

const VOICE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

export async function POST(req: Request) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY is not configured" },
      { status: 503 },
    );
  }

  const row = await getSettingsForUser(userId);
  const body = (await req.json().catch(() => null)) as null | {
    voiceId?: string;
    modelId?: string;
    text?: string;
    /** Workspace language (`en`, `ru`, `auto`, …) — drives `language_code` for ElevenLabs. */
    language?: string;
  };

  const fromBodyVoice = body?.voiceId?.trim();
  const voiceId =
    fromBodyVoice ||
    row?.ttsVoice?.trim() ||
    "";
  if (!voiceId || !VOICE_ID_PATTERN.test(voiceId)) {
    return NextResponse.json(
      { error: "Valid voiceId is required (ElevenLabs voice_id)." },
      { status: 400 },
    );
  }

  let modelId: string = ELEVENLABS_TTS_MODEL_IDS[0]!;
  const fromBodyModel = body?.modelId?.trim();
  if (fromBodyModel) {
    if (!isAllowedElevenLabsTtsModelId(fromBodyModel)) {
      return NextResponse.json({ error: "Invalid modelId" }, { status: 400 });
    }
    modelId = fromBodyModel;
  }

  const workspaceLang =
    body?.language?.trim() || row?.language?.trim() || "en";
  const languageCode =
    elevenLabsLanguageCodeFromWorkspaceLanguage(workspaceLang);

  const rawText = body?.text?.trim();
  const text = rawText
    ? rawText.slice(0, 4000)
    : workspaceLang === "ru"
      ? DEFAULT_TEXT_RU
      : DEFAULT_TEXT_EN;

  try {
    const audio = await synthesizeElevenLabsTtsMp3({
      apiKey,
      voiceId,
      modelId,
      text,
      languageCode,
    });
    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "TTS request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
