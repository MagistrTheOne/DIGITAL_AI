import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { emailOTP } from "better-auth/plugins/email-otp";
import { dash } from "@better-auth/infra";

// NOTE: This is intentionally a scaffolding-safe setup so the app boots
// without requiring auth tables/migrations yet. For production, swap the
// memory adapter with a real DB adapter (Drizzle/Neon).
const memoryDb = {} as Record<string, any[]>;

export const auth = betterAuth({
  database: memoryAdapter(memoryDb),
  // Used for session token signing cookies/CSRF. Replace with a real secret.
  secret: process.env.BETTER_AUTH_SECRET || "dev-secret",
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [
    dash({
      apiKey: process.env.BETTER_AUTH_API_KEY,
    }),
    emailOTP({
      // Dev-friendly OTP sender. Replace with a real email provider.
      sendVerificationOTP: async ({ email, otp }) => {
        // eslint-disable-next-line no-console
        console.log(`[Better Auth] Dev OTP for ${email}: ${otp}`);
      },
      sendVerificationOnSignUp: true,
    }),
  ],
} as any);

