"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { submitCreateEmployeeAction } from "@/features/employees/actions";
import type { EmployeeRoleCategory } from "@/features/employees/types";

import { BehaviorForm } from "@/components/create-employee/BehaviorForm";
import { IdentityForm } from "@/components/create-employee/IdentityForm";
import { PreviewPanel } from "@/components/create-employee/PreviewPanel";
import { RoleSelector } from "@/components/create-employee/RoleSelector";
import { Stepper } from "@/components/create-employee/Stepper";

const TOTAL_STEPS = 4;

export function CreateEmployeeWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const [role, setRole] = React.useState<EmployeeRoleCategory | null>(null);
  const [name, setName] = React.useState("");
  const [avatarPlaceholder, setAvatarPlaceholder] = React.useState("");
  const [prompt, setPrompt] = React.useState("");
  const [capabilities, setCapabilities] = React.useState<string[]>([]);

  const toggleCapability = React.useCallback((cap: string, checked: boolean) => {
    setCapabilities((prev) =>
      checked ? [...prev, cap] : prev.filter((c) => c !== cap),
    );
  }, []);

  const canGoNext = React.useMemo(() => {
    if (step === 0) return role !== null;
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return prompt.trim().length > 0;
    return true;
  }, [step, role, name, prompt]);

  const goNext = () => {
    if (!canGoNext) return;
    setError(null);
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const onSubmit = () => {
    if (!role || !name.trim() || !prompt.trim()) {
      setError("Complete role, name, and instructions before deploying.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitCreateEmployeeAction({
        role,
        name: name.trim(),
        avatarPlaceholder: avatarPlaceholder.trim() || undefined,
        prompt: prompt.trim(),
        capabilities,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/employees/${result.employeeId}`);
      router.refresh();
    });
  };

  return (
    <Card className="border-neutral-800 bg-neutral-950/50 shadow-none ring-0">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="text-lg text-neutral-100">Digital employee onboarding</CardTitle>
          <CardDescription className="text-neutral-500">
            Configure role, identity, and behavior — then deploy to your workforce.
          </CardDescription>
        </div>
        <Stepper currentStep={step} totalSteps={TOTAL_STEPS} />
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? (
          <Alert variant="destructive" className="border-red-500/40 bg-red-950/30">
            <AlertTitle className="text-sm">Couldn&apos;t create employee</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {step === 0 ? (
          <RoleSelector value={role} onChange={setRole} />
        ) : null}
        {step === 1 ? (
          <IdentityForm
            name={name}
            onNameChange={setName}
            avatarPlaceholder={avatarPlaceholder}
            onAvatarPlaceholderChange={setAvatarPlaceholder}
          />
        ) : null}
        {step === 2 ? (
          <BehaviorForm
            prompt={prompt}
            onPromptChange={setPrompt}
            capabilities={capabilities}
            onToggleCapability={toggleCapability}
          />
        ) : null}
        {step === 3 ? (
          <PreviewPanel
            role={role}
            name={name}
            avatarPlaceholder={avatarPlaceholder}
            prompt={prompt}
            capabilities={capabilities}
          />
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t border-neutral-800 pt-6 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          className="border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-900"
          disabled={step === 0 || pending}
          onClick={goBack}
        >
          Back
        </Button>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {step < TOTAL_STEPS - 1 ? (
            <Button
              type="button"
              className="bg-neutral-200 text-neutral-950 hover:bg-neutral-300"
              disabled={!canGoNext || pending}
              onClick={goNext}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-neutral-200 text-neutral-950 hover:bg-neutral-300"
              disabled={pending || !role || !name.trim() || !prompt.trim()}
              onClick={onSubmit}
            >
              {pending ? "Deploying…" : "Deploy employee"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
