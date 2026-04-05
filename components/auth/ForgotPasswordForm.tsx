"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MIN_PASSWORD = 8;

type Step = "request" | "reset";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("request");
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState("");
  const [error, setError] = React.useState("");

  const requestCode = async () => {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const result = await authClient.emailOtp.requestPasswordReset({
        email: email.trim(),
      });
      if (result.error) {
        setError(getAuthErrorMessage(result.error, "Could not send code."));
        return;
      }
      setStep("reset");
      setStatus(
        process.env.NODE_ENV === "development"
          ? "If this email is registered, a reset code was sent. Without RESEND_API_KEY, check the dev server logs."
          : "If this email is registered, you will receive a reset code shortly.",
      );
    } catch (e: unknown) {
      setError(getAuthErrorMessage(e, "Could not send code."));
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const result = await authClient.emailOtp.requestPasswordReset({
        email: email.trim(),
      });
      if (result.error) {
        setError(getAuthErrorMessage(result.error, "Could not resend code."));
        return;
      }
      setStatus("A new code was sent if this email is registered.");
    } catch (e: unknown) {
      setError(getAuthErrorMessage(e, "Could not resend code."));
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async () => {
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const result = await authClient.emailOtp.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        password,
      });
      if (result.error) {
        setError(getAuthErrorMessage(result.error, "Could not reset password."));
        return;
      }
      router.push("/sign-in");
      router.refresh();
    } catch (e: unknown) {
      setError(getAuthErrorMessage(e, "Could not reset password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-6">
        <div className="text-2xl font-semibold">Forgot password</div>
        <div className="mt-2 text-sm text-muted-foreground">
          {step === "request"
            ? "We will email a one-time code if this address is registered."
            : "Enter the code from your email and choose a new password."}
        </div>

        {step === "request" ? (
          <div className="mt-6 space-y-3">
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Button
              type="button"
              className="w-full"
              disabled={loading || !email.trim()}
              onClick={requestCode}
            >
              {loading ? "Please wait..." : "Send reset code"}
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              type="text"
              placeholder="One-time code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              autoComplete="one-time-code"
            />
            <Input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
            <Button
              type="button"
              className="w-full"
              disabled={
                loading || !email.trim() || !otp.trim() || !password || !confirm
              }
              onClick={submitNewPassword}
            >
              {loading ? "Please wait..." : "Update password"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={loading || !email.trim()}
              onClick={resendCode}
            >
              Resend code
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep("request");
                setOtp("");
                setPassword("");
                setConfirm("");
                setStatus("");
                setError("");
              }}
            >
              Use a different email
            </Button>
          </div>
        )}

        {status ? <div className="mt-3 text-xs text-emerald-600">{status}</div> : null}
        {error ? <div className="mt-3 text-xs text-destructive">{error}</div> : null}

        <div className="mt-4 space-y-2 text-center text-sm">
          <div>
            <Link href="/reset-password" className="text-muted-foreground hover:underline">
              Have a reset link instead?
            </Link>
          </div>
          <Link href="/sign-in" className="hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
