import { Polar } from "@polar-sh/sdk";
import { NextRequest, NextResponse } from "next/server";

import {
  getAppOrigin,
  getEnterprisePolarProductId,
  getPolarAccessToken,
  getPolarServer,
  getProPolarProductId,
} from "@/lib/billing/polar-env";
import { getCurrentSession } from "@/lib/auth/session.server";
import { nextResponseFromPolarFailure } from "@/lib/billing/polar-route-errors";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = getPolarAccessToken();
  if (!token) {
    return NextResponse.json(
      { error: "Polar checkout is not configured" },
      { status: 503 },
    );
  }

  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const planRaw = url.searchParams.get("plan")?.toLowerCase();
  const plan = planRaw === "enterprise" ? "enterprise" : "pro";

  const periodRaw = url.searchParams.get("period")?.toLowerCase();
  const period = periodRaw === "yearly" ? "yearly" : "monthly";

  const productId =
    plan === "enterprise"
      ? getEnterprisePolarProductId()
      : getProPolarProductId(period);

  if (!productId) {
    return NextResponse.json(
      {
        error:
          plan === "enterprise"
            ? "POLAR_PRODUCT_ENTERPRISE is not set"
            : "No Polar Pro product id for this billing period",
      },
      { status: 400 },
    );
  }

  const polar = new Polar({
    accessToken: token,
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

  const successUrl = `${origin}/settings?checkout=success`;
  const returnUrl = `${origin}/premium`;

  try {
    const result = await polar.checkouts.create({
      products: [productId],
      successUrl,
      returnUrl,
      externalCustomerId: session.user.id,
      customerEmail: session.user.email ?? undefined,
      customerName: session.user.name ?? undefined,
      metadata: { app_user_id: session.user.id },
    });
    return NextResponse.redirect(result.url);
  } catch (e) {
    return nextResponseFromPolarFailure(
      e,
      "Could not start checkout",
      "checkout create",
    );
  }
}
