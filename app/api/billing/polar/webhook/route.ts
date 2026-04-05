import { Webhooks } from "@polar-sh/nextjs";
import { NextResponse } from "next/server";

import { getPolarWebhookSecret } from "@/lib/billing/polar-env";
import { upsertPolarSubscription } from "@/services/db/repositories/subscription.repository";

export const dynamic = "force-dynamic";

const secret = getPolarWebhookSecret();

export const POST = secret
  ? Webhooks({
      webhookSecret: secret,
      onSubscriptionCreated: async ({ data }) => {
        await upsertPolarSubscription(data);
      },
      onSubscriptionUpdated: async ({ data }) => {
        await upsertPolarSubscription(data);
      },
      onSubscriptionActive: async ({ data }) => {
        await upsertPolarSubscription(data);
      },
      onSubscriptionCanceled: async ({ data }) => {
        await upsertPolarSubscription(data);
      },
      onSubscriptionUncanceled: async ({ data }) => {
        await upsertPolarSubscription(data);
      },
      onSubscriptionRevoked: async ({ data }) => {
        await upsertPolarSubscription(data);
      },
    })
  : async () =>
      NextResponse.json(
        { error: "Polar webhook secret is not configured" },
        { status: 503 },
      );
