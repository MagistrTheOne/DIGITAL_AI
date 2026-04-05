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

async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "NULLXES <onboarding@resend.dev>";

  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "RESEND_API_KEY (and EMAIL_FROM with a verified domain) are required in production for password reset and email verification.",
      );
    }
    // eslint-disable-next-line no-console
    console.log(
      `[Better Auth] Email to ${input.to}: ${input.subject}\n${input.text}`,
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
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
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}

const authOrigin = getAuthOrigin();
const apiKey = process.env.BETTER_AUTH_API_KEY?.trim();

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    transaction: false,
  }),
  user: {
    additionalFields: {
      organization: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
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
      await sendTransactionalEmail({
        to: user.email,
        subject: "Reset your NULLXES password",
        text: `Hi${user.name ? ` ${user.name}` : ""},\n\nReset your password using this link (expires soon):\n${url}\n\nIf you did not request this, you can ignore this email.`,
        html: `<p>Hi${user.name ? ` ${escapeHtml(user.name)}` : ""},</p><p>Reset your password using the link below (expires soon):</p><p><a href="${escapeHtml(url)}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
      });
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
        await sendTransactionalEmail({
          to: email,
          subject: "Your NULLXES verification code",
          text: `Your verification code is: ${otp}\n\nIt expires shortly. If you did not sign up, ignore this email.`,
          html: `<p>Your verification code is:</p><p style="font-size:1.25rem;font-weight:600;letter-spacing:0.2em">${escapeHtml(otp)}</p><p>It expires shortly. If you did not sign up, ignore this email.</p>`,
        });
      },
      sendVerificationOnSignUp: true,
    }),
  ],
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
