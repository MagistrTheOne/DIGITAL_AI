"use client";

import { createAuthClient } from "better-auth/react";
import { dashClient, sentinelClient } from "@better-auth/infra/client";
import { emailOTPClient } from "better-auth/client/plugins";

/**
 * Публичный origin (туннель или прод). Должен совпадать с BETTER_AUTH_URL.
 */
const publicAuthOrigin =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim() ||
      process.env.NEXT_PUBLIC_AUTH_URL?.trim();

export const authClient = createAuthClient({
  baseURL: publicAuthOrigin,
  plugins: [emailOTPClient(), dashClient(), sentinelClient()],
});
