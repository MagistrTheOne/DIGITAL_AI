import { NextResponse } from "next/server";

type PolarLikeError = {
  statusCode: number;
  body: string;
};

function isPolarLikeError(e: unknown): e is PolarLikeError {
  return (
    typeof e === "object" &&
    e !== null &&
    "statusCode" in e &&
    typeof (e as { statusCode: unknown }).statusCode === "number" &&
    "body" in e &&
    typeof (e as { body: unknown }).body === "string"
  );
}

const TOKEN_HINT =
  "In Polar: Settings → Developers → Organization Access Token. Set POLAR_ACCESS_TOKEN in .env. " +
  "POLAR_SERVER must match where the token was issued: sandbox token → POLAR_SERVER=sandbox; " +
  "live polar.sh token → POLAR_SERVER=production. Products must exist in that same environment.";

/**
 * Maps @polar-sh/sdk HTTP failures to JSON for API routes (checkout / portal).
 */
export function nextResponseFromPolarFailure(
  e: unknown,
  fallback: string,
  logLabel: string,
): NextResponse {
  if (isPolarLikeError(e)) {
    if (e.statusCode === 401) {
      console.error(`[polar] ${logLabel}: invalid_token (check POLAR_ACCESS_TOKEN + POLAR_SERVER)`);
      return NextResponse.json(
        {
          error: "Polar rejected POLAR_ACCESS_TOKEN (expired, revoked, or wrong environment).",
          hint: TOKEN_HINT,
          polarHttpStatus: 401,
        },
        { status: 502 },
      );
    }

    console.error(`[polar] ${logLabel}: HTTP ${e.statusCode}`, e.body?.slice(0, 500));
    return NextResponse.json(
      {
        error: fallback,
        polarHttpStatus: e.statusCode,
        detail: e.body?.slice(0, 800),
      },
      { status: e.statusCode >= 400 && e.statusCode < 600 ? e.statusCode : 502 },
    );
  }

  console.error(`[polar] ${logLabel}`, e);
  return NextResponse.json({ error: fallback }, { status: 502 });
}
