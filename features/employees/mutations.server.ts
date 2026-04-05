import type { EmployeeDTO, EmployeeRoleCategory } from "@/features/employees/types";

export type CreateEmployeeInput = {
  name: string;
  roleCategory: EmployeeRoleCategory;
  verified?: boolean;
  videoPreviewSrc?: string;
};

// Placeholder mutation.
// Real persistence is added once the DB schema + repository layer are finalized.
export async function createEmployee(input: CreateEmployeeInput): Promise<EmployeeDTO> {
  return {
    id: `emp_${Date.now()}`,
    name: input.name,
    roleCategory: input.roleCategory,
    roleLabel: input.roleCategory,
    verified: input.verified ?? false,
    capabilities: [],
    videoPreview: input.videoPreviewSrc
      ? { src: input.videoPreviewSrc, type: "video/mp4" }
      : undefined,
    avatarPreview: {
      renderStatus: "idle",
      jobId: null,
      error: null,
    },
  };
}

