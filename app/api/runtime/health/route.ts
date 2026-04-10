import { NextResponse } from "next/server";

import { getElevenLabsLastVoicesFetchOk } from "@/lib/inference/providers/elevenlabs.server";
import type { RuntimeHealthPayload } from "@/lib/inference/runtime-catalog.types";

export const runtime = "nodejs";

function elevenLabsHealth(): RuntimeHealthPayload["elevenlabs"] {
  const key = Boolean(process.env.ELEVENLABS_API_KEY?.trim());
  if (!key) return "disabled";
  const last = getElevenLabsLastVoicesFetchOk();
  if (last === false) return "degraded";
  return "ok";
}

export async function GET() {
  const openaiConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());

  const body: RuntimeHealthPayload = {
    openai: openaiConfigured ? "ok" : "error",
    elevenlabs: elevenLabsHealth(),
  };

  return NextResponse.json(body, {
    headers: { "Cache-Control": "no-store" },
  });
}
