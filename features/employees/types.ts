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
  q?: string;
  role?: EmployeeRoleFilter;
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

