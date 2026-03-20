export type EmployeeRoleCategory =
  | "CFO"
  | "Marketing"
  | "Operations"
  | "Product"
  | "Customer Support";

export type EmployeeRoleFilter = "All" | EmployeeRoleCategory;

export type EmployeeId = string;

export type EmployeeCapability = string;

export type EmployeeVideoPreview = {
  src: string;
  type?: string;
};

export type EmployeeDTO = {
  id: EmployeeId;
  name: string;
  roleCategory: EmployeeRoleCategory;
  verified: boolean;
  capabilities: EmployeeCapability[];
  videoPreview?: EmployeeVideoPreview;
};

export type EmployeeListQuery = {
  /** Tenant scope — required for listing. */
  userId: string;
  q?: string;
  role?: EmployeeRoleFilter;
};

/** Input for BFF `createEmployee` (onboarding wizard). */
export type CreateEmployeeInput = {
  role: EmployeeRoleCategory;
  name: string;
  avatarPlaceholder?: string;
  prompt: string;
  capabilities: string[];
};

export type EmployeeSessionBootstrapDTO = {
  sessionId: string;
  employee: EmployeeDTO;
  websocket: {
    url: string;
    token: string;
  };
  capabilities: EmployeeCapability[];
};

