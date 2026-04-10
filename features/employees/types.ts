import type { AvatarRenderStage, RenderStatus } from "./avatar-preview.types";
import type { AvatarVoiceMode } from "./avatar-voice.types";

export type EmployeeRoleCategory =
  | "CFO"
  | "Marketing"
  | "Operations"
  | "Product"
  | "Customer Support"
  | "Other";

export type EmployeeRoleFilter = "All" | EmployeeRoleCategory;

export type EmployeeId = string;

export type EmployeeCapability = string;

export type EmployeeVideoPreview = {
  src: string;
  type?: string;
};

export type EmployeeAvatarPreviewState = {
  renderStatus: RenderStatus;
  jobId: string | null;
  error: string | null;
  /** Set while auto digital-human pipeline is running. */
  renderStage: AvatarRenderStage | null;
};

export type EmployeeDTO = {
  id: EmployeeId;
  name: string;
  roleCategory: EmployeeRoleCategory;
  /** Human-readable role (custom title when role is Other). */
  roleLabel: string;
  verified: boolean;
  capabilities: EmployeeCapability[];
  videoPreview?: EmployeeVideoPreview;
  avatarPreview?: EmployeeAvatarPreviewState;
  /**
   * Public https URL suitable as InfiniteTalk `image` input (identity ref or https avatar placeholder).
   * Used for one-shot identity clip when infra is configured.
   */
  identityClipImageUrl?: string | null;
};

export type EmployeeListQuery = {
  /** Tenant scope — required for listing. */
  userId: string;
  q?: string;
  /** Filter by persisted `employees.role` (Other = custom job titles). */
  role?: EmployeeRoleFilter;
};

/** Input for BFF `createEmployee` / finalize draft (onboarding wizard). */
export type CreateEmployeeInput = {
  role: EmployeeRoleCategory;
  /** Required when `role === "Other"` (trimmed, min length enforced server-side). */
  roleCustomTitle?: string;
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
  /** RunPod session avatar pipeline (Ditto / ARACHNE T2V); optional feature flag from env. */
  avatarRenderPipelineEnabled?: boolean;
  /** Default hybrid realtime→enhanced when pipeline is enabled (env `AVATAR_PIPELINE_HYBRID_ENHANCE_DEFAULT=1`). */
  avatarRenderHybridDefault?: boolean;
  /**
   * `realtime` = OpenAI audio (default); `sync` = OpenAI text + ElevenLabs + InfiniteTalk (env `NULLXES_AVATAR_VOICE_MODE=sync`).
   */
  avatarVoiceMode?: AvatarVoiceMode;
};

