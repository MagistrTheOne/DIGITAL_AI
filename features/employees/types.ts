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

/** ARACHNE-X realtime mint result surfaced to the client. */
export type EmployeeRealtimeBootstrap =
  | { ok: true; issuedAt: string; expiresAt: string }
  | { ok: false; error: string };

/**
 * Safe subset of POST /v1/avatar/bootstrap (or legacy mint with null extras).
 * No service keys — server-only mint; browser gets this via RSC props only.
 */
export type EmployeeArachneAvatarBootstrapDTO = {
  videoPreviewUrl: string | null;
  avatarPreviewStatus: string | null;
  pipelineMode: string | null;
  arachneOutputProfile: string | null;
  audioTransport: string | null;
  avatarPreviewCached: boolean;
  /** `bootstrap` = unified /v1/avatar/bootstrap; `legacy_mint` = /v1/realtime/token only. */
  sessionSource: "bootstrap" | "legacy_mint";
};

export type EmployeeSessionBootstrapDTO = {
  /** UI session id (mint body); new UUID per page load. */
  sessionId: string;
  employee: EmployeeDTO;
  websocket: {
    url: string;
    token: string;
  };
  capabilities: EmployeeCapability[];
  realtime: EmployeeRealtimeBootstrap;
  /** Set when realtime.ok; ARACHNE avatar bootstrap metadata for UI / video src. */
  arachneAvatar: EmployeeArachneAvatarBootstrapDTO | null;
};

