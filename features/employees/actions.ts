"use server";

import { createEmployee } from "@/features/employees/service.server";
import type { CreateEmployeeInput } from "@/features/employees/types";

export async function submitCreateEmployeeAction(
  input: CreateEmployeeInput,
): Promise<
  | { ok: true; employeeId: string }
  | { ok: false; error: string }
> {
  return createEmployee(input);
}
