/**
 * Server-only ElevenLabs text-to-speech (standard HTTP). Never expose `xi-api-key` to clients.
 * @see https://elevenlabs.io/docs/eleven-api/quickstart
 */

const OUTPUT_FORMAT = "mp3_44100_128";

export type ElevenLabsTtsSynthesizeInput = {
  apiKey: string;
  voiceId: string;
  modelId: string;
  text: string;
  /** ISO 639-1; omit for model auto / inference (UI: "auto"). */
  languageCode?: string;
};

/** Map saved workspace language to ElevenLabs `language_code` (omit when auto). */
export function elevenLabsLanguageCodeFromWorkspaceLanguage(
  language: string | undefined | null,
): string | undefined {
  const v = language?.trim().toLowerCase();
  if (!v || v === "auto") return undefined;
  if (/^[a-z]{2}$/.test(v)) return v;
  return undefined;
}

export async function synthesizeElevenLabsTtsMp3(
  input: ElevenLabsTtsSynthesizeInput,
): Promise<ArrayBuffer> {
  const { apiKey, voiceId, modelId, text, languageCode } = input;
  const url = new URL(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
  );
  url.searchParams.set("output_format", OUTPUT_FORMAT);

  const payload: Record<string, string> = {
    text,
    model_id: modelId,
  };
  if (languageCode) {
    payload.language_code = languageCode;
  }

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `ElevenLabs TTS HTTP ${res.status}${errText ? `: ${errText.slice(0, 200)}` : ""}`,
    );
  }

  return res.arrayBuffer();
}
