"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth/auth-errors";
import { GithubIcon, GoogleIcon } from "./oauth-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CALLBACK_PATH = "/ai-digital";

export function SignInForm() {
  const router = useRouter();

  const [tab, setTab] = React.useState<"password" | "otp">("password");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");

  const [loadingProvider, setLoadingProvider] = React.useState<null | "google" | "github">(null);
  const [loadingAction, setLoadingAction] = React.useState<null | "password" | "otp" | "sendOtp">(null);

  const [status, setStatus] = React.useState("");
  const [error, setError] = React.useState("");

  const isEmailValid = email.includes("@");
  const canPassword = isEmailValid && password.length > 0;
  const canOtp = isEmailValid && otp.length >= 4;

  const redirect = () => {
    router.push(CALLBACK_PATH);
    router.refresh();
  };

  const handleError = (e: unknown, fallback: string) => {
    setError(getAuthErrorMessage(e, fallback));
  };

  const signInSocial = React.useCallback(async (provider: "google" | "github") => {
    setLoadingProvider(provider);
    setError("");

    try {
      await authClient.signIn.social({
        provider,
        callbackURL: CALLBACK_PATH,
      });
    } catch (e) {
      setError(getAuthErrorMessage(e, `${provider} sign-in failed.`));
      setLoadingProvider(null);
    }
  }, []);

  const onOauthGoogle = React.useCallback(() => {
    void signInSocial("google");
  }, [signInSocial]);

  const onOauthGithub = React.useCallback(() => {
    void signInSocial("github");
  }, [signInSocial]);

  const signInPassword = async () => {
    if (!canPassword) return;

    setLoadingAction("password");
    setError("");

    try {
      const res = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (res.error) {
        handleError(res.error, "Invalid credentials.");
        return;
      }

      redirect();
    } catch (e) {
      handleError(e, "Invalid credentials.");
    } finally {
      setLoadingAction(null);
    }
  };

  const sendOtp = async () => {
    if (!isEmailValid) return;

    setLoadingAction("sendOtp");
    setError("");
    setStatus("");

    try {
      const res = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "sign-in",
      });

      if (res.error) {
        handleError(res.error, "Unable to send code.");
        return;
      }

      setStatus("Code sent. Check your email.");
    } catch (e) {
      handleError(e, "Unable to send code.");
    } finally {
      setLoadingAction(null);
    }
  };

  const signInOtp = async () => {
    if (!canOtp) return;

    setLoadingAction("otp");
    setError("");

    try {
      const res = await authClient.signIn.emailOtp({
        email: email.trim(),
        otp: otp.trim(),
      });

      if (res.error) {
        handleError(res.error, "Invalid code.");
        return;
      }

      redirect();
    } catch (e) {
      handleError(e, "Invalid code.");
    } finally {
      setLoadingAction(null);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;

    if (tab === "password") {
      signInPassword();
    } else {
      signInOtp();
    }
  };

  const oauthBusy = loadingProvider !== null;

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm">

        <div className="text-2xl font-semibold tracking-tight">Welcome back</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Sign in to your NULLXES workspace
        </div>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "password" | "otp")}
          className="mt-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="otp">Code</TabsTrigger>
          </TabsList>

          <TabsContent value="password" className="mt-4 space-y-3">
            <Input
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={onKeyDown}
            />

            <Button
              className="w-full"
              disabled={!canPassword || loadingAction === "password"}
              onClick={signInPassword}
            >
              {loadingAction === "password" ? "Signing in..." : "Sign in"}
            </Button>

            <div className="text-center text-sm">
              <Link href="/forgot-password" className="text-muted-foreground hover:underline">
                Forgot password?
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="otp" className="mt-4 space-y-3">
            <Input
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onKeyDown}
            />

            <div className="flex gap-2">
              <Input
                placeholder="Code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                onKeyDown={onKeyDown}
              />

              <Button
                variant="secondary"
                disabled={!isEmailValid || loadingAction === "sendOtp"}
                onClick={sendOtp}
              >
                {loadingAction === "sendOtp" ? "..." : "Send"}
              </Button>
            </div>

            <Button
              className="w-full"
              disabled={!canOtp || loadingAction === "otp"}
              onClick={signInOtp}
            >
              {loadingAction === "otp" ? "Checking..." : "Sign in with code"}
            </Button>
          </TabsContent>
        </Tabs>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              or continue with a provider
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={oauthBusy}
            onClick={onOauthGoogle}
          >
            <GoogleIcon />
            {loadingProvider === "google" ? "Connecting…" : "Continue with Google"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={oauthBusy}
            onClick={onOauthGithub}
          >
            <GithubIcon />
            {loadingProvider === "github" ? "Connecting…" : "Continue with GitHub"}
          </Button>
        </div>

        {status && <div className="mt-3 text-xs text-emerald-500">{status}</div>}
        {error && <div className="mt-3 text-xs text-destructive">{error}</div>}

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            Back
          </Link>
          <Link href="/sign-up" className="hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
