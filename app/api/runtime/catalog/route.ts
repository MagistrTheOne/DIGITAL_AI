import { NextResponse } from "next/server";

import {
  getRuntimeCatalogPayload,
  getRuntimeCatalogPayloadSync,
} from "@/lib/inference/catalog.server";
import type { RuntimeCatalogPayload } from "@/lib/inference/runtime-catalog.types";

export const runtime = "nodejs";

/** Production: 10m. Dev: short TTL so a new ELEVENLABS_API_KEY shows up without a long wait. */
const TTL_MS =
  process.env.NODE_ENV === "development"
    ? 45 * 1000
    : 10 * 60 * 1000;

const cacheControlCatalog = `private, max-age=${Math.floor(TTL_MS / 1000)}, stale-while-revalidate=${Math.floor(TTL_MS / 2000)}`;

let memoryCache: { payload: RuntimeCatalogPayload; expiresAt: number } | null =
  null;

export async function GET() {
  const now = Date.now();
  if (memoryCache && memoryCache.expiresAt > now) {
    return NextResponse.json(memoryCache.payload, {
      headers: {
        "Cache-Control": cacheControlCatalog,
        "X-Runtime-Catalog-Cache": "hit",
      },
    });
  }

  try {
    const payload = await getRuntimeCatalogPayload();
    memoryCache = { payload, expiresAt: now + TTL_MS };
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": cacheControlCatalog,
        "X-Runtime-Catalog-Cache": "miss",
      },
    });
  } catch {
    const payload = getRuntimeCatalogPayloadSync(true);
    memoryCache = { payload, expiresAt: now + TTL_MS };
    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=60",
        "X-Runtime-Catalog-Cache": "error-fallback",
      },
    });
  }
}
