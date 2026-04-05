"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/lib/auth/auth-errors";
import { GithubIcon, GoogleIcon } from "./oauth-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CALLBACK_PATH = "/ai-digital";

type Step = "register" | "verify";

export function SignUpForm() {
  const router = useRouter();

  const [step, setStep] = React.useState<Step>("register");

  const [name, setName] = React.useState("");
  const [org, setOrg] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [otp, setOtp] = React.useState("");

  const [loadingProvider, setLoadingProvider] = React.useState<null | "google" | "github">(null);
  const [loadingAction, setLoadingAction] = React.useState<null | "register" | "verify" | "resend">(null);

  const [status, setStatus] = React.useState("");
  const [error, setError] = React.useState("");

  const isEmailValid = email.includes("@");
  const canRegister = name.trim() && isEmailValid && password.length >= 8 && password === confirm;
  const canVerify = otp.trim().length >= 4;

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

  const register = async () => {
    if (!canRegister) return;

    setLoadingAction("register");
    setError("");
    setStatus("");

    try {
      const res = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
        callbackURL: CALLBACK_PATH,
        ...(org.trim() ? { organization: org.trim() } : {}),
      });

      if (res.error) {
        handleError(res.error, "Could not create account.");
        return;
      }

      if (!res.data?.user?.emailVerified) {
        setStep("verify");
        setStatus("Verification code sent to your email.");
        return;
      }

      redirect();
    } catch (e) {
      handleError(e, "Could not create account.");
    } finally {
      setLoadingAction(null);
    }
  };

  const verify = async () => {
    if (!canVerify) return;

    setLoadingAction("verify");
    setError("");

    try {
      const res = await authClient.emailOtp.verifyEmail({
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

  const resend = async () => {
    setLoadingAction("resend");
    setError("");
    setStatus("");

    try {
      await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "email-verification",
      });

      setStatus("New code sent.");
    } catch (e) {
      handleError(e, "Could not resend.");
    } finally {
      setLoadingAction(null);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;

    if (step === "register") register();
    else verify();
  };

  const oauthBusy = loadingProvider !== null;

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm">

        <div className="text-2xl font-semibold">Create workspace</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Start your NULLXES environment
        </div>

        {step === "register" ? (
          <>
            <div className="mt-6 space-y-3">
            <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={onKeyDown} />
            <Input placeholder="Organization (optional)" value={org} onChange={(e) => setOrg(e.target.value)} />
            <Input placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={onKeyDown} />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={onKeyDown} />
            <Input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={onKeyDown} />

            <Button
              className="w-full"
              disabled={!canRegister || loadingAction === "register"}
              onClick={register}
            >
              {loadingAction === "register" ? "Creating..." : "Create account"}
            </Button>
            </div>

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
          </>
        ) : (
          <div className="mt-6 space-y-3">
            <Input placeholder="Verification code" value={otp} onChange={(e) => setOtp(e.target.value)} onKeyDown={onKeyDown} />

            <Button
              className="w-full"
              disabled={!canVerify || loadingAction === "verify"}
              onClick={verify}
            >
              {loadingAction === "verify" ? "Verifying..." : "Verify email"}
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              disabled={loadingAction === "resend"}
              onClick={resend}
            >
              {loadingAction === "resend" ? "..." : "Resend code"}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setStep("register")}
            >
              Back
            </Button>
          </div>
        )}

        {status && <div className="mt-3 text-xs text-emerald-500">{status}</div>}
        {error && <div className="mt-3 text-xs text-destructive">{error}</div>}

        <div className="mt-6 flex justify-between text-sm">
          <Link href="/" className="text-muted-foreground">Back</Link>
          <Link href="/sign-in">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
