"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MIN_PASSWORD = 8;
const MAX_ORGANIZATION_LEN = 120;
const CALLBACK_PATH = "/ai-digital";

type Step = "register" | "verify";

export function SignUpForm({ showGoogleSignIn }: { showGoogleSignIn: boolean }) {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("register");
  const [name, setName] = React.useState("");
  const [organization, setOrganization] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState("");
  const [error, setError] = React.useState("");

  const signUpWithGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: CALLBACK_PATH,
      });
    } catch (e: unknown) {
      setError(getAuthErrorMessage(e, "Google sign-up failed."));
      setLoading(false);
    }
  };

  const submitRegister = async () => {
    setError("");
    setStatus("");
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    const orgTrimmed = organization.trim();
    if (orgTrimmed.length > MAX_ORGANIZATION_LEN) {
      setError(`Organization must be at most ${MAX_ORGANIZATION_LEN} characters.`);
      return;
    }
    setLoading(true);
    try {
      const result = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
        callbackURL: CALLBACK_PATH,
        ...(orgTrimmed
          ? { organization: orgTrimmed }
          : {}),
      });
      if (result.error) {
        setError(getAuthErrorMessage(result.error, "Could not create account."));
        return;
      }
      const user = result.data?.user;
      if (user && !user.emailVerified) {
        setStep("verify");
        setStatus(
          process.env.NODE_ENV === "development"
            ? "Account created. Enter the verification code from your email. If RESEND_API_KEY is not set, check the dev server logs for the code."
            : "Account created. Enter the verification code sent to your email.",
        );
        return;
      }
      router.push(CALLBACK_PATH);
      router.refresh();
    } catch (e: unknown) {
      setError(getAuthErrorMessage(e, "Could not create account."));
    } finally {
      setLoading(false);
    }
  };

  const submitVerify = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await authClient.emailOtp.verifyEmail({
        email: email.trim(),
        otp: otp.trim(),
      });
      if (result.error) {
        setError(getAuthErrorMessage(result.error, "Invalid or expired code."));
        return;
      }
      router.push(CALLBACK_PATH);
      router.refresh();
    } catch (e: unknown) {
      setError(getAuthErrorMessage(e, "Invalid or expired code."));
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "email-verification",
      });
      if (result.error) {
        setError(getAuthErrorMessage(result.error, "Could not resend code."));
        return;
      }
      setStatus("A new code was sent.");
    } catch (e: unknown) {
      setError(getAuthErrorMessage(e, "Could not resend code."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-6">
        <div className="text-2xl font-semibold">Create account</div>
        <div className="mt-2 text-sm text-muted-foreground">
          Email and password. Verify your email with a one-time code when prompted.
        </div>

        {step === "register" ? (
          <>
            {showGoogleSignIn ? (
              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                  onClick={signUpWithGoogle}
                >
                  Continue with Google
                </Button>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or register with email</span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-2 space-y-3">
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
              <Input
                placeholder="Your organization (optional)"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                autoComplete="organization"
                maxLength={MAX_ORGANIZATION_LEN}
              />
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
              <Button
                type="button"
                className="w-full"
                disabled={loading || !name.trim() || !email.trim() || !password || !confirm}
                onClick={submitRegister}
              >
                {loading ? "Please wait..." : "Create account"}
              </Button>
            </div>
          </>
        ) : (
          <div className="mt-6 space-y-3">
            <Input
              type="text"
              placeholder="Verification code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              autoComplete="one-time-code"
            />
            <Button
              type="button"
              className="w-full"
              disabled={loading || !otp.trim()}
              onClick={submitVerify}
            >
              {loading ? "Please wait..." : "Verify email"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={loading || !email.trim()}
              onClick={resendVerification}
            >
              Resend code
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep("register");
                setOtp("");
                setStatus("");
                setError("");
              }}
            >
              Back
            </Button>
          </div>
        )}

        {status ? <div className="mt-3 text-xs text-emerald-600">{status}</div> : null}
        {error ? <div className="mt-3 text-xs text-destructive">{error}</div> : null}

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            Back to app
          </Link>
          <Link href="/sign-in" className="hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
