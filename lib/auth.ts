import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { dash } from "@better-auth/infra";

import { db } from "@/db";
import * as schema from "@/db/schema";

/* =========================
   ENV HELPERS
========================= */

function getAuthSecret(): string {
  const s = process.env.BETTER_AUTH_SECRET?.trim();

  if (process.env.NODE_ENV === "production") {
    if (!s) {
      throw new Error("BETTER_AUTH_SECRET is required in production");
    }
    return s;
  }

  return s || "dev-secret-only-local";
}

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

/**
 * Better Auth uses this to build OAuth callback URLs (e.g. /api/auth/callback/google).
 * In production it must match your deployed origin or providers return redirect_uri_mismatch.
 * @see https://www.better-auth.com/docs/authentication/google
 * @see https://www.better-auth.com/docs/authentication/github
 */
function getBaseUrl(): string {
  const origin = getAuthOrigin();
  if (origin) return origin;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "BETTER_AUTH_URL is required in production so OAuth callbacks match provider redirect URIs.",
    );
  }
  return "http://localhost:3000";
}

/* =========================
   EMAIL SENDER
========================= */

async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "NULLXES <no-reply@nullxes.com>";

  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY required in production");
    }

    console.log(
      `[AUTH:DEV_EMAIL] → ${input.to}\n${input.subject}\n${input.text}`
    );
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend error ${res.status}: ${body}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

type EmailOtpType =
  | "sign-in"
  | "email-verification"
  | "forget-password"
  | "change-email";

function otpEmailForType(
  email: string,
  otp: string,
  type: EmailOtpType,
): { to: string; subject: string; html: string; text: string } {
  const codeBlock = `<p style="font-size:1.4rem;font-weight:600;letter-spacing:0.25em">${escapeHtml(otp)}</p>`;
  const codePlain = `Your code: ${otp}`;

  if (type === "sign-in") {
    return {
      to: email,
      subject: "NULLXES — Sign-in code",
      text: `${codePlain}\n\nUse this code to sign in. It expires shortly. If you did not request it, ignore this email.`,
      html: `<p>Your sign-in code:</p>${codeBlock}<p>Use it to sign in. It expires shortly. If you did not request it, ignore this email.</p>`,
    };
  }
  if (type === "email-verification") {
    return {
      to: email,
      subject: "NULLXES — Verify your email",
      text: `${codePlain}\n\nEnter this code to verify your email. It expires shortly.`,
      html: `<p>Your verification code:</p>${codeBlock}<p>Enter this code to verify your email. It expires shortly.</p>`,
    };
  }
  if (type === "forget-password") {
    return {
      to: email,
      subject: "NULLXES — Password reset code",
      text: `${codePlain}\n\nUse this code to choose a new password. It expires shortly. If you did not request a reset, ignore this email.`,
      html: `<p>Your password reset code:</p>${codeBlock}<p>Use it to choose a new password. It expires shortly. If you did not request a reset, ignore this email.</p>`,
    };
  }
  return {
    to: email,
    subject: "NULLXES — Verification code",
    text: `${codePlain}\n\nIt expires shortly. If you did not request this, ignore this email.`,
    html: `<p>Your verification code:</p>${codeBlock}<p>It expires shortly. If you did not request this, ignore this email.</p>`,
  };
}

/* =========================
   PROVIDERS
   Lazy async configs: read env when Better Auth resolves providers (not at module top),
   so Next/Turbopack and .env are applied before OAuth is registered.
========================= */

async function resolveGoogleSocialProvider() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return { enabled: false as const, clientId: "", clientSecret: "" };
  }

  const config: {
    clientId: string;
    clientSecret: string;
    enabled?: boolean;
    prompt?: string;
    accessType?: "offline";
  } = { clientId, clientSecret };

  const prompt = process.env.GOOGLE_OAUTH_PROMPT?.trim();
  if (prompt) {
    config.prompt = prompt as never;
  }
  if (process.env.GOOGLE_OAUTH_ACCESS_TYPE?.trim() === "offline") {
    config.accessType = "offline";
  }
  return config;
}

async function resolveGithubSocialProvider() {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return { enabled: false as const, clientId: "", clientSecret: "" };
  }
  return { clientId, clientSecret };
}

function assertProductionOAuthConfigured() {
  if (process.env.NODE_ENV !== "production") return;
  const hasGoogle = Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
  const hasGithub = Boolean(
    process.env.GITHUB_CLIENT_ID?.trim() &&
      process.env.GITHUB_CLIENT_SECRET?.trim(),
  );
  if (!hasGoogle && !hasGithub) {
    throw new Error(
      "At least one OAuth provider (Google or GitHub) must be configured",
    );
  }
}

assertProductionOAuthConfigured();

/* =========================
   MAIN AUTH
========================= */

const authOrigin = getAuthOrigin();
const baseURL = getBaseUrl();
const apiKey = process.env.BETTER_AUTH_API_KEY?.trim();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    transaction: false,
  }),

  secret: getAuthSecret(),

  baseURL,

  advanced: {
    trustedProxyHeaders: true,
  },

  trustedOrigins:
    process.env.NODE_ENV === "production"
      ? [baseURL]
      : [
          baseURL,
          "http://localhost:3000",
          "http://127.0.0.1:3000",
        ],

  user: {
    additionalFields: {
      organization: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },

  emailAndPassword: {
    enabled: true,

    sendResetPassword: async ({ user, url }) => {
      await sendTransactionalEmail({
        to: user.email,
        subject: "NULLXES Security — Reset Password",
        text: `Hi${user.name ? ` ${user.name}` : ""},

Reset your password:
${url}

If this wasn't you — ignore this message.`,

        html: `
<p>Hi${user.name ? ` ${escapeHtml(user.name)}` : ""},</p>
<p>Reset your password:</p>
<p><a href="${escapeHtml(url)}">Reset password</a></p>
<p>If this wasn't you — ignore this message.</p>
        `,
      });
    },
  },

  socialProviders: {
    google: () => resolveGoogleSocialProvider(),
    github: () => resolveGithubSocialProvider(),
  } as BetterAuthOptions["socialProviders"],

  plugins: [
    ...(apiKey ? [dash({ apiKey })] : []),

    emailOTP({
      /**
       * Do not await the transport: reduces timing side channels (Better Auth Email OTP docs).
       * Failures are logged; Resend still runs to completion in the background.
       */
      sendVerificationOTP: async ({ email, otp, type }) => {
        const payload = otpEmailForType(email, otp, type as EmailOtpType);
        void sendTransactionalEmail(payload).catch((err) => {
          console.error("[Better Auth] Email OTP send failed:", err);
        });
      },
      sendVerificationOnSignUp: true,
    }),
  ],
});

/* =========================
   UTILS
========================= */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}