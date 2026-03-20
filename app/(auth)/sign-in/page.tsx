"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");

  const sendCode = async () => {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const client = authClient as any;
      // $fetch returns { data, error } — not the JSON body at the top level
      const result = await client.$fetch("/email-otp/send-verification-otp", {
        method: "POST",
        body: {
          email,
          type: "sign-in",
        },
      });
      const payload = result?.data ?? result;
      if (payload?.success) {
        setStatus("OTP code sent. Check your email (or dev console logs).");
      } else {
        setError("Unable to send OTP.");
      }
    } catch (e: any) {
      setError(e?.message ?? "Unable to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const client = authClient as any;
      const result = await client.$fetch("/sign-in/email-otp", {
        method: "POST",
        body: {
          email,
          otp,
        },
      });
      const payload = result?.data ?? result;
      if (payload?.token || payload?.user) {
        router.push("/ai-digital");
        router.refresh();
        return;
      }
      setError("Invalid OTP or sign-in failed.");
    } catch (e: any) {
      setError(e?.message ?? "Invalid OTP or sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-6">
        <div className="text-2xl font-semibold">Sign in</div>
        <div className="mt-2 text-sm text-muted-foreground">
          Email OTP authentication powered by Better Auth.
        </div>

        <div className="mt-6 space-y-3">
          <Input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter OTP code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={loading || !email}
              onClick={sendCode}
            >
              Send code
            </Button>
          </div>
          <Button
            type="button"
            className="w-full"
            disabled={loading || !email || !otp}
            onClick={signIn}
          >
            {loading ? "Please wait..." : "Sign in"}
          </Button>
        </div>

        {status ? <div className="mt-3 text-xs text-emerald-600">{status}</div> : null}
        {error ? <div className="mt-3 text-xs text-destructive">{error}</div> : null}

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            Back to app
          </Link>
          <Link href="/sign-up" className="hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}

