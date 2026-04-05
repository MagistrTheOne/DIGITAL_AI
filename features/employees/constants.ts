import type { EmployeeRoleCategory } from "@/features/employees/types";

/** Filter tabs for AI Digital directory (matches persisted `role` values). */
export const ROLE_FILTERS: Array<"All" | EmployeeRoleCategory> = [
  "All",
  "CFO",
  "Marketing",
  "Operations",
  "Product",
  "Customer Support",
  "Other",
];
