"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MIN_PASSWORD = 8;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const urlError = searchParams.get("error");

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(
    urlError === "INVALID_TOKEN"
      ? "This reset link is invalid or has expired. Request a new one."
      : "",
  );
  const [done, setDone] = React.useState(false);

  const submit = async () => {
    if (!token) {
      setError("Missing reset token. Open the link from your email again.");
      return;
    }
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
    try {
      const result = await authClient.resetPassword({
        token,
        newPassword: password,
      });
      if (result.error) {
        setError(getAuthErrorMessage(result.error, "Could not reset password."));
        return;
      }
      setDone(true);
      router.push("/sign-in");
      router.refresh();
    } catch (e: unknown) {
      setError(getAuthErrorMessage(e, "Could not reset password."));
    } finally {
      setLoading(false);
    }
  };

  if (!token && !urlError) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          <p>Missing reset token. Use the link from your reset email.</p>
          <Link href="/forgot-password" className="mt-4 inline-block hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-6">
        <div className="text-2xl font-semibold">Set new password</div>
        <div className="mt-2 text-sm text-muted-foreground">
          Choose a new password using the link from your email (not the one-time code flow).
        </div>

        <div className="mt-6 space-y-3">
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
            disabled={loading || !token || !password || !confirm}
            onClick={submit}
          >
            {loading ? "Please wait..." : "Update password"}
          </Button>
        </div>

        {done ? (
          <div className="mt-3 text-xs text-emerald-600">
            Password updated. Redirecting to sign in…
          </div>
        ) : null}
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
