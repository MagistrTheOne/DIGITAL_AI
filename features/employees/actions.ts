"use server";

import type { RenderStatus } from "@/features/employees/avatar-preview.types";
import {
  createEmployee,
  ensureDraftEmployee,
  finalizeDraftEmployee,
  getEmployeeForDashboard,
} from "@/features/employees/service.server";
import type { CreateEmployeeInput } from "@/features/employees/types";

export async function submitCreateEmployeeAction(
  input: CreateEmployeeInput,
): Promise<
  { ok: true; employeeId: string } | { ok: false; error: string }
> {
  return createEmployee(input);
}

export async function ensureDraftEmployeeAction(
  input: CreateEmployeeInput,
  draftEmployeeId: string | null,
): Promise<
  { ok: true; employeeId: string } | { ok: false; error: string }
> {
  return ensureDraftEmployee(input, draftEmployeeId);
}

export async function finalizeDraftEmployeeAction(
  draftEmployeeId: string,
  input: CreateEmployeeInput,
): Promise<
  { ok: true; employeeId: string } | { ok: false; error: string }
> {
  return finalizeDraftEmployee(draftEmployeeId, input);
}

export async function getEmployeeAvatarPreviewStateAction(employeeId: string): Promise<
  | {
      ok: true;
      renderStatus: RenderStatus;
      videoUrl: string | null;
      jobId: string | null;
      error: string | null;
    }
  | { ok: false; error: string }
> {
  const employee = await getEmployeeForDashboard(employeeId);
  if (!employee) {
    return { ok: false, error: "Not found" };
  }
  return {
    ok: true,
    renderStatus: employee.avatarPreview?.renderStatus ?? "idle",
    videoUrl: employee.videoPreview?.src ?? null,
    jobId: employee.avatarPreview?.jobId ?? null,
    error: employee.avatarPreview?.error ?? null,
  };
}
