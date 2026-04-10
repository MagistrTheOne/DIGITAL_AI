"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { dashboardGlassCardClassName } from "@/components/shared/dashboardGlassCard";
import { BehaviorForm } from "@/components/create-employee/BehaviorForm";
import { IdentityForm } from "@/components/create-employee/IdentityForm";
import { RoleAndAppearanceStep } from "@/components/create-employee/RoleAndAppearanceStep";
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
  deleteEmployeeAction,
  updateEmployeeAction,
} from "@/features/employees/actions";
import type {
  CreateEmployeeInput,
  EmployeeRoleCategory,
} from "@/features/employees/types";

export function EditEmployeeForm({
  employeeId,
  initialInput,
}: {
  employeeId: string;
  initialInput: CreateEmployeeInput;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const [role, setRole] = React.useState<EmployeeRoleCategory | null>(
    initialInput.role,
  );
  const [roleCustomTitle, setRoleCustomTitle] = React.useState(
    initialInput.roleCustomTitle ?? "",
  );
  const [name, setName] = React.useState(initialInput.name);
  const [avatarPlaceholder, setAvatarPlaceholder] = React.useState(
    initialInput.avatarPlaceholder ?? "",
  );
  const [prompt, setPrompt] = React.useState(initialInput.prompt);
  const [capabilities, setCapabilities] = React.useState<string[]>(
    initialInput.capabilities,
  );

  const toggleCapability = React.useCallback((cap: string, checked: boolean) => {
    setCapabilities((prev) =>
      checked ? [...prev, cap] : prev.filter((c) => c !== cap),
    );
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

  const canSave = React.useMemo(() => {
    if (!role) return false;
    if (role === "Other" && roleCustomTitle.trim().length < 2) return false;
    if (!name.trim()) return false;
    if (!prompt.trim()) return false;
    return true;
  }, [role, roleCustomTitle, name, prompt]);

  const onSave = () => {
    if (!canSave || !role) return;
    setError(null);
    startTransition(async () => {
      try {
        const input = buildInput();
        const res = await updateEmployeeAction(employeeId, input);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        router.push(`/employees/${encodeURIComponent(employeeId)}`);
        router.refresh();
      } catch {
        setError("Save failed.");
      }
    });
  };

  const onDelete = () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Delete this digital employee permanently? Integrations and knowledge for them will be removed.",
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await deleteEmployeeAction(employeeId);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        router.push("/ai-digital");
        router.refresh();
      } catch {
        setError("Delete failed.");
      }
    });
  };

  return (
    <Card size="sm" className={dashboardGlassCardClassName()}>
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-sm text-neutral-100">Edit employee</CardTitle>
        <CardDescription className="text-xs text-neutral-500">
          Name, role, look, instructions, and capabilities are saved to the database.
          Video and portrait URLs are kept unless you regenerate them elsewhere.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {error ? (
          <Alert variant="destructive" className="border-red-500/40 bg-red-950/30">
            <AlertTitle className="text-sm">Couldn&apos;t save</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <RoleAndAppearanceStep
          appearanceDescription={avatarPlaceholder}
          onAppearanceChange={setAvatarPlaceholder}
          role={role}
          customTitle={roleCustomTitle}
          onRoleChange={setRole}
          onCustomTitleChange={setRoleCustomTitle}
        />

        <IdentityForm name={name} onNameChange={setName} />

        <BehaviorForm
          prompt={prompt}
          onPromptChange={setPrompt}
          capabilities={capabilities}
          onToggleCapability={toggleCapability}
        />
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t border-neutral-800/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="destructive"
          className="w-full border-red-900/50 bg-red-950/40 text-red-200 hover:bg-red-950/60 sm:w-auto"
          disabled={pending}
          onClick={onDelete}
        >
          Delete employee
        </Button>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-900"
            disabled={pending}
            asChild
          >
            <Link href={`/employees/${encodeURIComponent(employeeId)}`}>
              Cancel
            </Link>
          </Button>
          <Button
            type="button"
            className="bg-neutral-200 text-neutral-950 hover:bg-neutral-300"
            disabled={!canSave || pending}
            onClick={onSave}
          >
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
