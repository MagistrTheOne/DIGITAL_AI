"use client";

import * as React from "react";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState("");
  const [error, setError] = React.useState("");

  const submit = async () => {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const result = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: `${origin}/reset-password`,
      });
      if (result.error) {
        setError(getAuthErrorMessage(result.error, "Something went wrong."));
        return;
      }
      setStatus(
        process.env.NODE_ENV === "development"
          ? "If an account exists for this email, you will receive reset instructions. Without RESEND_API_KEY, check the dev server logs for the link."
          : "If an account exists for this email, you will receive reset instructions shortly.",
      );
    } catch (e: unknown) {
      setError(getAuthErrorMessage(e, "Something went wrong."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-6">
        <div className="text-2xl font-semibold">Forgot password</div>
        <div className="mt-2 text-sm text-muted-foreground">
          We will email a link to reset your password if this address is registered.
        </div>

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
            onClick={submit}
          >
            {loading ? "Please wait..." : "Send reset link"}
          </Button>
        </div>

        {status ? <div className="mt-3 text-xs text-emerald-600">{status}</div> : null}
        {error ? <div className="mt-3 text-xs text-destructive">{error}</div> : null}

        <div className="mt-4 text-center text-sm">
          <Link href="/sign-in" className="hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
