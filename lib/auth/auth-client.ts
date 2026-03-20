"use client";

import { createAuthClient } from "better-auth/react";
import { dashClient, sentinelClient } from "@better-auth/infra/client";
import { emailOTPClient } from "better-auth/client/plugins";

// Client-side auth instance (used by future sign-in UI and profile widgets).
export const authClient = createAuthClient({
  plugins: [
    emailOTPClient(),
    dashClient(),
    sentinelClient(),
  ],
});

