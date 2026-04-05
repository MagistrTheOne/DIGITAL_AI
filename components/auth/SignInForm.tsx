"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CALLBACK_PATH = "/ai-digital";

export function SignInForm({ showGoogleSignIn }: { showGoogleSignIn: boolean }) {
  const router = useRouter();
  const [tab, setTab] = React.useState<"password" | "otp">("password");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState("");
  const [error, setError] = React.useState("");

  const signInWithGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: CALLBACK_PATH,
      });
    } catch (e: unknown) {
      setError(getAuthErrorMessage(e, "Google sign-in failed."));
      setLoading(false);
    }
  };

  const signInWithPassword = async () => {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (result.error) {
        setError(getAuthErrorMessage(result.error, "Invalid email or password."));
        return;
      }
      router.push(CALLBACK_PATH);
      router.refresh();
    } catch (e: unknown) {
      setError(getAuthErrorMessage(e, "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "sign-in",
      });
      if (result.error) {
        setError(getAuthErrorMessage(result.error, "Unable to send code."));
        return;
      }
      const ok = result.data?.success === true;
      setStatus(ok ? "Code sent. Check your email (or dev server logs)." : "If this email is registered, a code was sent.");
    } catch (e: unknown) {
      setError(getAuthErrorMessage(e, "Unable to send code."));
    } finally {
      setLoading(false);
    }
  };

  const signInWithOtp = async () => {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const result = await authClient.signIn.emailOtp({
        email: email.trim(),
        otp: otp.trim(),
      });
      if (result.error) {
        setError(getAuthErrorMessage(result.error, "Invalid code or sign-in failed."));
        return;
      }
      router.push(CALLBACK_PATH);
      router.refresh();
    } catch (e: unknown) {
      setError(getAuthErrorMessage(e, "Invalid code or sign-in failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-6">
        <div className="text-2xl font-semibold">Sign in</div>
        <div className="mt-2 text-sm text-muted-foreground">
          Password, email code
        </div>

        {showGoogleSignIn ? (
          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={signInWithGoogle}
            >
              Continue with Google
            </Button>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>
          </div>
        ) : null}

        <Tabs value={tab} onValueChange={(v) => setTab(v as "password" | "otp")} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="otp">Email code</TabsTrigger>
          </TabsList>
          <TabsContent value="password" className="mt-4 space-y-3">
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
              autoComplete="current-password"
            />
            <Button
              type="button"
              className="w-full"
              disabled={loading || !email.trim() || !password}
              onClick={signInWithPassword}
            >
              {loading ? "Please wait..." : "Sign in"}
            </Button>
            <div className="text-center text-sm">
              <Link href="/forgot-password" className="text-muted-foreground hover:underline">
                Forgot password?
              </Link>
            </div>
          </TabsContent>
          <TabsContent value="otp" className="mt-4 space-y-3">
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="One-time code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoComplete="one-time-code"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={loading || !email.trim()}
                onClick={sendOtp}
              >
                Send code
              </Button>
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={loading || !email.trim() || !otp.trim()}
              onClick={signInWithOtp}
            >
              {loading ? "Please wait..." : "Sign in with code"}
            </Button>
          </TabsContent>
        </Tabs>

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
