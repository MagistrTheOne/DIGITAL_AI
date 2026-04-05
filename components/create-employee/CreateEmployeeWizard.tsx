"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { dashboardGlassCardClassName } from "@/components/shared/dashboardGlassCard";
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
import {
  ensureDraftEmployeeAction,
  finalizeDraftEmployeeAction,
  submitCreateEmployeeAction,
} from "@/features/employees/actions";
import type { CreateEmployeeInput, EmployeeRoleCategory } from "@/features/employees/types";

import { BehaviorForm } from "@/components/create-employee/BehaviorForm";
import { IdentityForm } from "@/components/create-employee/IdentityForm";
import { PreviewPanel } from "@/components/create-employee/PreviewPanel";
import { RoleSelector } from "@/components/create-employee/RoleSelector";
import { Stepper } from "@/components/create-employee/Stepper";

const TOTAL_STEPS = 4;
const DRAFT_STORAGE_KEY = "nullxes.createEmployee.draftId";

function readDraftIdFromStorage(): string | null {
  try {
    return sessionStorage.getItem(DRAFT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeDraftIdToStorage(id: string) {
  try {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, id);
  } catch {
    /* private mode */
  }
}

function clearDraftIdFromStorage() {
  try {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    /* private mode */
  }
}

function previewRoleLabel(
  role: EmployeeRoleCategory | null,
  customTitle: string,
): string {
  if (!role) return "";
  if (role === "Other") return customTitle.trim() || "Other";
  return role;
}

export function CreateEmployeeWizard({
  avatarPreviewGenerateEnabled,
}: {
  avatarPreviewGenerateEnabled: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const [role, setRole] = React.useState<EmployeeRoleCategory | null>(null);
  const [roleCustomTitle, setRoleCustomTitle] = React.useState("");
  const [name, setName] = React.useState("");
  const [avatarPlaceholder, setAvatarPlaceholder] = React.useState("");
  const [prompt, setPrompt] = React.useState("");
  const [capabilities, setCapabilities] = React.useState<string[]>([]);
  const [draftEmployeeId, setDraftEmployeeId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const stored = readDraftIdFromStorage();
    if (stored) setDraftEmployeeId(stored);
  }, []);

  const buildInput = React.useCallback((): CreateEmployeeInput => {
    if (!role) {
      throw new Error("Role required");
    }
    return {
      role,
      ...(role === "Other"
        ? { roleCustomTitle: roleCustomTitle.trim() }
        : {}),
      name: name.trim(),
      avatarPlaceholder: avatarPlaceholder.trim() || undefined,
      prompt: prompt.trim(),
      capabilities,
    };
  }, [role, roleCustomTitle, name, avatarPlaceholder, prompt, capabilities]);

  const toggleCapability = React.useCallback((cap: string, checked: boolean) => {
    setCapabilities((prev) =>
      checked ? [...prev, cap] : prev.filter((c) => c !== cap),
    );
  }, []);

  const canGoNext = React.useMemo(() => {
    if (step === 0) {
      if (role === null) return false;
      if (role === "Other") return roleCustomTitle.trim().length >= 2;
      return true;
    }
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return prompt.trim().length > 0;
    return true;
  }, [step, role, roleCustomTitle, name, prompt]);

  const goNext = () => {
    if (!canGoNext) return;
    setError(null);

    if (step === 2) {
      startTransition(async () => {
        try {
          const input = buildInput();
          const res = await ensureDraftEmployeeAction(
            input,
            draftEmployeeId ?? readDraftIdFromStorage(),
          );
          if (!res.ok) {
            setError(res.error);
            return;
          }
          setDraftEmployeeId(res.employeeId);
          writeDraftIdToStorage(res.employeeId);
          setStep(3);
        } catch {
          setError("Could not save draft. Try again.");
        }
      });
      return;
    }

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
    if (role === "Other" && roleCustomTitle.trim().length < 2) {
      setError("Enter a job title (at least 2 characters).");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const input = buildInput();
        const storedDraft = draftEmployeeId ?? readDraftIdFromStorage();
        const result = storedDraft
          ? await finalizeDraftEmployeeAction(storedDraft, input)
          : await submitCreateEmployeeAction(input);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        clearDraftIdFromStorage();
        router.push("/ai-digital");
        router.refresh();
      } catch {
        setError("Deploy failed. Try again.");
      }
    });
  };

  return (
    <Card size="sm" className={dashboardGlassCardClassName()}>
      <CardHeader className="space-y-3 pb-2">
        <div className="space-y-0.5">
          <CardTitle className="text-sm text-neutral-100">Digital employee onboarding</CardTitle>
          <CardDescription className="text-xs text-neutral-500">
            Configure role, identity, and behavior — then deploy.
          </CardDescription>
        </div>
        <Stepper currentStep={step} totalSteps={TOTAL_STEPS} />
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive" className="border-red-500/40 bg-red-950/30">
            <AlertTitle className="text-sm">Couldn&apos;t create employee</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {step === 0 ? (
          <RoleSelector
            value={role}
            customTitle={roleCustomTitle}
            onChange={setRole}
            onCustomTitleChange={setRoleCustomTitle}
          />
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
            roleLabel={previewRoleLabel(role, roleCustomTitle)}
            name={name}
            avatarPlaceholder={avatarPlaceholder}
            prompt={prompt}
            capabilities={capabilities}
            draftEmployeeId={draftEmployeeId}
            avatarPreviewGenerateEnabled={avatarPreviewGenerateEnabled}
          />
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t border-neutral-800/80 pt-3 sm:flex-row sm:justify-between">
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
              {step === 2 && pending ? "Saving draft…" : "Continue"}
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-neutral-200 text-neutral-950 hover:bg-neutral-300"
              disabled={
                pending ||
                !role ||
                !name.trim() ||
                !prompt.trim() ||
                (role === "Other" && roleCustomTitle.trim().length < 2)
              }
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
