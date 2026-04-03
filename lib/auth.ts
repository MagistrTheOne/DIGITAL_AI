import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins/email-otp";
import { dash } from "@better-auth/infra";

import { db } from "@/db";
import * as schema from "@/db/schema";

function getAuthSecret(): string {
  const s = process.env.BETTER_AUTH_SECRET?.trim();
  if (process.env.NODE_ENV === "production") {
    if (!s) {
      throw new Error(
        "BETTER_AUTH_SECRET is required in production. Set it in your environment.",
      );
    }
    return s;
  }
  return s || "dev-secret-only-local";
}

/** Origin only, no trailing slash. */
function getAuthOrigin(): string | undefined {
  const raw =
    process.env.BETTER_AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim();
  if (!raw) return undefined;
  try {
    return new URL(raw).origin;
  } catch {
    return raw.replace(/\/+$/, "");
  }
}

const authOrigin = getAuthOrigin();
const apiKey = process.env.BETTER_AUTH_API_KEY?.trim();

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

// if (process.env.NODE_ENV === "development" && !apiKey) {
//   // eslint-disable-next-line no-console
//   console.warn(
//     "[Better Auth] BETTER_AUTH_API_KEY is missing — Dash / dashboard checks may fail.",
//   );
// }

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    // Neon serverless HTTP driver — без классических транзакций
    transaction: false,
  }),
  secret: getAuthSecret(),
  baseURL: authOrigin,
  advanced: {
    trustedProxyHeaders: true,
  },
  trustedOrigins: [
    ...(authOrigin ? [authOrigin] : []),
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // Replace with Resend / transactional email in production.
      // eslint-disable-next-line no-console
      console.log(`[Better Auth] Password reset for ${user.email}: ${url}`);
    },
  },
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {},
  plugins: [
    dash({
      apiKey: apiKey ?? "",
    }),
    emailOTP({
      sendVerificationOTP: async ({ email, otp }) => {
        // eslint-disable-next-line no-console
        console.log(`[Better Auth] Dev OTP for ${email}: ${otp}`);
      },
      sendVerificationOnSignUp: true,
    }),
  ],
});
