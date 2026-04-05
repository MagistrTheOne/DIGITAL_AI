import type { EmployeeRoleCategory } from "@/features/employees/types";

export const ROLE_OPTIONS: EmployeeRoleCategory[] = [
  "CFO",
  "Marketing",
  "Operations",
  "Product",
  "Customer Support",
];

export const CAPABILITY_OPTIONS = [
  "Email",
  "CRM",
  "Slack",
  "Voice",
  "Scheduling",
] as const;

export const STEP_LABELS = [
  "Role & look",
  "Identity",
  "Behavior",
  "Preview",
] as const;
