import OpenAI from "openai";

import {
  autoDigitalHumanImageApi,
  autoDigitalHumanOpenAiImageModel,
  autoDigitalHumanResponsesModel,
  autoDigitalHumanToolImageModel,
} from "@/lib/avatar/auto-digital-human-env.server";

const PLACEHOLDER_FALLBACK =
  "professional adult in modern business attire, approachable expression";

/**
 * Matches Create Employee wizard “Appearance for video avatar” intent
 * (`{avatarPlaceholder}` → role / look line).
 */
export function buildDigitalHumanPortraitPrompt(avatarPlaceholder: string): string {
  const detail = avatarPlaceholder.trim() || PLACEHOLDER_FALLBACK;
  const trimmed = detail.slice(0, 2000);
  return [
    "Ultra realistic portrait of a professional digital human,",
    trimmed + ",",
    "neutral facial expression,",
    "looking straight at camera,",
    "studio lighting,",
    "clean background,",
    "high detail skin texture,",
    "corporate appearance,",
    "no distortion,",
    "symmetrical face",
  ].join("\n");
}

function portraitResultFromResponsesOutput(response: unknown): string | null {
  if (!response || typeof response !== "object") return null;
  const raw = (response as { output?: unknown }).output;
  if (!Array.isArray(raw)) return null;
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (o.type !== "image_generation_call") continue;
    if (o.status === "failed") continue;
    if (typeof o.result === "string" && o.result.length > 0) {
      return o.result;
    }
  }
  return null;
}

export async function generateDigitalHumanPortraitPng(input: {
  apiKey: string;
  avatarPlaceholder: string;
  /** Optional override for Images API; default from env. */
  model?: string;
}): Promise<
  | { ok: true; png: Buffer }
  | { ok: false; error: string }
> {
  const openai = new OpenAI({ apiKey: input.apiKey });
  const prompt = buildDigitalHumanPortraitPrompt(input.avatarPlaceholder);

  try {
    if (autoDigitalHumanImageApi() === "responses") {
      const res = await openai.responses.create({
        model: autoDigitalHumanResponsesModel(),
        input: prompt,
        tools: [
          {
            type: "image_generation",
            action: "generate",
            model: autoDigitalHumanToolImageModel() as
              | "gpt-image-1"
              | "gpt-image-1-mini"
              | "gpt-image-1.5",
          },
        ],
      });

      const b64 = portraitResultFromResponsesOutput(res);
      if (!b64?.trim()) {
        return {
          ok: false,
          error:
            "OpenAI Responses image_generation returned no completed image data",
        };
      }
      return { ok: true, png: Buffer.from(b64, "base64") };
    }

    const model = input.model ?? autoDigitalHumanOpenAiImageModel();
    const imgRes = await openai.images.generate({
      model,
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "medium",
      output_format: "png",
      stream: false,
    });

    const item = imgRes.data?.[0];
    const b64Json = item?.b64_json;
    if (typeof b64Json !== "string" || !b64Json.trim()) {
      return {
        ok: false,
        error: "OpenAI image generation returned no image data",
      };
    }
    return { ok: true, png: Buffer.from(b64Json, "base64") };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "OpenAI image generation failed",
    };
  }
}
