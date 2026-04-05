import { Polar } from "@polar-sh/sdk";
import { NextResponse } from "next/server";

import {
  getAppOrigin,
  getPolarAccessToken,
  getPolarServer,
  isPolarPortalConfigured,
} from "@/lib/billing/polar-env";
import { getCurrentSession } from "@/lib/auth/session.server";
import { nextResponseFromPolarFailure } from "@/lib/billing/polar-route-errors";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isPolarPortalConfigured()) {
    return NextResponse.json(
      { error: "Polar customer portal is not configured" },
      { status: 503 },
    );
  }

  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const polar = new Polar({
    accessToken: getPolarAccessToken()!,
    server: getPolarServer(),
  });

  let origin: string;
  try {
    origin = getAppOrigin();
  } catch {
    return NextResponse.json(
      { error: "BETTER_AUTH_URL or NEXT_PUBLIC_BETTER_AUTH_URL must be set" },
      { status: 503 },
    );
  }

  const returnUrl = `${origin}/settings`;

  try {
    const { customerPortalUrl } = await polar.customerSessions.create({
      returnUrl,
      externalCustomerId: session.user.id,
    });
    return NextResponse.redirect(customerPortalUrl);
  } catch (e) {
    return nextResponseFromPolarFailure(
      e,
      "Could not open billing portal",
      "customer portal session",
    );
  }
}
