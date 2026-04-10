import type {
  CreateEmployeeInput,
  EmployeeDTO,
  EmployeeListQuery,
  EmployeeRoleCategory,
  EmployeeSessionBootstrapDTO,
} from "@/features/employees/types";

import { getAvatarVoiceModeFromEnv } from "@/lib/avatar/avatar-voice-mode.server";
import {
  avatarPipelineHybridEnhanceDefaultFromEnv,
  isAvatarRenderPipelineEnvEnabled,
} from "@/lib/avatar/pipeline-env.server";
import { getCurrentSession } from "@/lib/auth/session.server";
import { getPlanForUser } from "@/services/db/repositories/billing.repository";
import {
  countEmployeesForUser,
  getEmployeeById,
  getEmployeeRowById,
  deleteEmployeeRow,
  insertEmployeeRow,
  listEmployeesByQuery,
  updateEmployeeRow,
  type EmployeeConfigJson,
  type EmployeeRecord,
} from "@/services/db/repositories/employees.repository";
import { normalizeAvatarLookDetailForStorage } from "@/lib/avatar/avatar-appearance-normalize";
import { resolveIdentityClipImageUrlFromRecord } from "@/lib/avatar/identity-clip.server";
import { mintArachneSessionForEmployee } from "@/features/arachne-x/server/arachneAvatarBootstrap.server";
import { enqueuePostDeployAvatarGeneration } from "@/lib/inference/avatar-generation-after-deploy.server";
import {
  listClientIntegrationsForEmployee,
} from "@/services/db/repositories/employee-integration.repository";
import { listKnowledgeDocumentsForEmployee } from "@/services/db/repositories/knowledge.repository";

function toRoleCategory(role: string): EmployeeRoleCategory {
  switch (role) {
    case "CFO":
    case "Marketing":
    case "Operations":
    case "Product":
    case "Customer Support":
    case "Other":
      return role;
    default:
      return "Operations";
  }
}

function recordToEmployeeDTO(r: EmployeeRecord): EmployeeDTO {
  const identityClipImageUrl = resolveIdentityClipImageUrlFromRecord(r);
  return {
    id: r.id,
    name: r.name,
    roleCategory: toRoleCategory(r.role_category),
    roleLabel: r.role_label,
    verified: r.verified,
    capabilities: r.capabilities,
    videoPreview: r.video_preview_url
      ? { src: r.video_preview_url, type: "video/mp4" }
      : undefined,
    avatarPreview: {
      renderStatus: r.avatar_render_status,
      jobId: r.avatar_preview_job_id,
      error: r.avatar_preview_error,
      renderStage: r.avatar_render_stage,
    },
    identityClipImageUrl: identityClipImageUrl ?? undefined,
  };
}

function toEmployeeDTO(
  record: Awaited<ReturnType<typeof getEmployeeById>>,
): EmployeeDTO | null {
  if (!record) return null;

  return recordToEmployeeDTO(record);
}

function ensureVantageName(raw: string): string {
  const t = raw.trim();
  if (!t) return "Agent Vantage";
  return t.toLowerCase().endsWith("vantage") ? t : `${t} Vantage`;
}

function validateRoleInput(
  input: CreateEmployeeInput,
): { ok: true } | { ok: false; error: string } {
  if (input.role === "Other") {
    const t = input.roleCustomTitle?.trim() ?? "";
    if (t.length < 2) {
      return { ok: false, error: "Enter a job title (at least 2 characters)." };
    }
    if (t.length > 80) {
      return { ok: false, error: "Job title is too long (max 80 characters)." };
    }
  }
  return { ok: true };
}

function dbRoleFromInput(input: CreateEmployeeInput): string {
  return input.role === "Other" ? "Other" : input.role;
}

/** Wizard fields merged into `config` — safe for updates (does not clear video / identity URLs). */
export function employeeConfigPatchFromWizard(
  input: CreateEmployeeInput,
): Partial<EmployeeConfigJson> {
  const lookRaw = input.avatarPlaceholder?.trim() ?? "";
  const avatarPlaceholder = lookRaw
    ? normalizeAvatarLookDetailForStorage(lookRaw) || null
    : null;
  return {
    prompt: input.prompt,
    capabilities: input.capabilities,
    avatarPlaceholder,
    roleCustomTitle:
      input.role === "Other"
        ? (input.roleCustomTitle ?? "").trim()
        : null,
  };
}

function employeeConfigFromWizard(input: CreateEmployeeInput): EmployeeConfigJson {
  return {
    ...employeeConfigPatchFromWizard(input),
    promptTemplateVersion: 1,
  } as EmployeeConfigJson;
}

function rowToCreateEmployeeInput(
  row: NonNullable<Awaited<ReturnType<typeof getEmployeeRowById>>>,
): CreateEmployeeInput {
  const cfg = (row.config ?? {}) as EmployeeConfigJson;
  const roleCategory = toRoleCategory(row.role);
  const caps = Array.isArray(cfg.capabilities)
    ? cfg.capabilities.filter((x): x is string => typeof x === "string")
    : [];
  return {
    role: roleCategory,
    ...(roleCategory === "Other"
      ? { roleCustomTitle: (cfg.roleCustomTitle ?? "").trim() || undefined }
      : {}),
    name: row.name,
    avatarPlaceholder:
      typeof cfg.avatarPlaceholder === "string"
        ? cfg.avatarPlaceholder
        : undefined,
    prompt: typeof cfg.prompt === "string" ? cfg.prompt : "",
    capabilities: caps,
  };
}

/** Session-scoped list for AI Digital (server components only). */
export async function getEmployeesForDashboard(): Promise<{
  employees: EmployeeDTO[];
}> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return { employees: [] };

  return getEmployeeDashboardDTOs({ userId });
}

export async function getEmployeeDashboardDTOs(input: EmployeeListQuery): Promise<{
  employees: EmployeeDTO[];
}> {
  const records = await listEmployeesByQuery(input);

  return {
    employees: records.map((r) => recordToEmployeeDTO(r)),
  };
}

/** Single employee for dashboard routes — scoped to current session user. */
export async function getEmployeeForDashboard(
  employeeId: string,
): Promise<EmployeeDTO | null> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return null;

  const record = await getEmployeeById(employeeId, userId);
  if (!record) return null;

  return recordToEmployeeDTO(record);
}

export async function getEmployeeSessionBootstrap(
  employeeId: string,
  options?: { nullxesSessionId?: string },
): Promise<EmployeeSessionBootstrapDTO> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  const record = await getEmployeeById(employeeId, userId);

  const employee =
    toEmployeeDTO(record) ?? {
      id: employeeId,
      name: "Unknown Employee",
      roleCategory: "Operations",
      roleLabel: "Operations",
      verified: false,
      capabilities: [],
      avatarPreview: {
        renderStatus: "idle",
        jobId: null,
        error: null,
        renderStage: null,
      },
    };

  const sessionId = crypto.randomUUID();
  const mint = await mintArachneSessionForEmployee({
    sessionId,
    employeeId,
    nullxesSessionId: options?.nullxesSessionId?.trim() || undefined,
  });

  const pipelineFlags = {
    avatarRenderPipelineEnabled: isAvatarRenderPipelineEnvEnabled(),
    avatarRenderHybridDefault: avatarPipelineHybridEnhanceDefaultFromEnv(),
    avatarVoiceMode: getAvatarVoiceModeFromEnv(),
  };

  if (!mint.ok) {
    return {
      sessionId,
      employee,
      websocket: { url: "", token: "" },
      capabilities: employee.capabilities,
      realtime: { ok: false, error: mint.error },
      arachneAvatar: null,
      ...pipelineFlags,
    };
  }

  return {
    sessionId,
    employee,
    websocket: {
      url: mint.websocketUrl,
      token: mint.token,
    },
    capabilities: employee.capabilities,
    realtime: {
      ok: true,
      issuedAt: mint.issuedAt,
      expiresAt: mint.expiresAt,
    },
    arachneAvatar: {
      videoPreviewUrl: mint.videoPreviewUrl,
      avatarPreviewStatus: mint.avatarPreviewStatus,
      pipelineMode: mint.pipelineMode,
      arachneOutputProfile: mint.arachneOutputProfile,
      audioTransport: mint.audioTransport,
      avatarPreviewCached: mint.avatarPreviewCached,
      sessionSource: mint.source,
    },
    ...pipelineFlags,
  };
}

/**
 * Create a new AI employee — plan cap enforced before insert (active rows only).
 */
export async function createEmployee(
  input: CreateEmployeeInput,
): Promise<{ ok: true; employeeId: string } | { ok: false; error: string }> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Unauthorized" };

  const roleCheck = validateRoleInput(input);
  if (!roleCheck.ok) return roleCheck;

  const plan = await getPlanForUser(userId);
  const maxEmployees = plan.limits.employees;
  const current = await countEmployeesForUser(userId);
  if (maxEmployees !== -1 && current >= maxEmployees) {
    return {
      ok: false,
      error: `Your ${plan.label} plan allows up to ${maxEmployees} AI employees. Upgrade to add more.`,
    };
  }

  const name = ensureVantageName(input.name);
  const role = dbRoleFromInput(input);
  const config = employeeConfigFromWizard(input);

  try {
    const { id } = await insertEmployeeRow({
      userId,
      name,
      role,
      status: "active",
      config,
    });

    enqueuePostDeployAvatarGeneration({
      employeeId: id,
      userId,
      name,
      role,
      config: config as EmployeeConfigJson,
    });

    return { ok: true, employeeId: id };
  } catch (err) {
    if (isPostgresMissingRelationError(err)) {
      return {
        ok: false,
        error:
          "Database is missing the employees table. From the project root run: npm run db:push (uses DATABASE_URL from .env.local).",
      };
    }
    throw err;
  }
}

/**
 * Ensure a draft row exists before the Preview step (step 2 → 3). Plan cap not applied.
 */
export async function ensureDraftEmployee(
  input: CreateEmployeeInput,
  draftEmployeeId: string | null,
): Promise<{ ok: true; employeeId: string } | { ok: false; error: string }> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Unauthorized" };

  const roleCheck = validateRoleInput(input);
  if (!roleCheck.ok) return roleCheck;

  const name = ensureVantageName(input.name);
  const config = employeeConfigFromWizard(input);
  const role = dbRoleFromInput(input);

  try {
    if (draftEmployeeId?.trim()) {
      const row = await getEmployeeRowById(draftEmployeeId.trim(), userId);
      if (!row) {
        // Stale browser draft id (e.g. new DB / Neon branch, cleared data, or deleted row).
        const { id } = await insertEmployeeRow({
          userId,
          name,
          role,
          status: "draft",
          config,
        });
        return { ok: true, employeeId: id };
      }
      if (row.status !== "draft") {
        return { ok: false, error: "This employee is no longer a draft." };
      }
      await updateEmployeeRow({
        employeeId: draftEmployeeId.trim(),
        userId,
        name,
        role,
        config,
      });
      return { ok: true, employeeId: draftEmployeeId.trim() };
    }

    const { id } = await insertEmployeeRow({
      userId,
      name,
      role,
      status: "draft",
      config,
    });
    return { ok: true, employeeId: id };
  } catch (err) {
    if (isPostgresMissingRelationError(err)) {
      return {
        ok: false,
        error:
          "Database is missing the employees table. From the project root run: npm run db:push (uses DATABASE_URL from .env.local).",
      };
    }
    throw err;
  }
}

/**
 * Finalize draft → active, enforce plan cap, enqueue RunPod avatar job when configured.
 */
export async function finalizeDraftEmployee(
  draftEmployeeId: string,
  input: CreateEmployeeInput,
): Promise<{ ok: true; employeeId: string } | { ok: false; error: string }> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Unauthorized" };

  const roleCheck = validateRoleInput(input);
  if (!roleCheck.ok) return roleCheck;

  const row = await getEmployeeRowById(draftEmployeeId.trim(), userId);
  if (!row) {
    // Same stale-id case as ensureDraftEmployee: deploy as a new active employee.
    return createEmployee(input);
  }
  if (row.status !== "draft") {
    return { ok: false, error: "This employee is already deployed." };
  }

  const plan = await getPlanForUser(userId);
  const maxEmployees = plan.limits.employees;
  const current = await countEmployeesForUser(userId);
  if (maxEmployees !== -1 && current >= maxEmployees) {
    return {
      ok: false,
      error: `Your ${plan.label} plan allows up to ${maxEmployees} AI employees. Upgrade to add more.`,
    };
  }

  const name = ensureVantageName(input.name);
  const config = employeeConfigFromWizard(input);
  const role = dbRoleFromInput(input);

  try {
    await updateEmployeeRow({
      employeeId: draftEmployeeId.trim(),
      userId,
      name,
      role,
      status: "active",
      config,
    });

    enqueuePostDeployAvatarGeneration({
      employeeId: draftEmployeeId.trim(),
      userId,
      name,
      role,
      config: config as EmployeeConfigJson,
    });

    return { ok: true, employeeId: draftEmployeeId.trim() };
  } catch (err) {
    if (isPostgresMissingRelationError(err)) {
      return {
        ok: false,
        error:
          "Database is missing the employees table. From the project root run: npm run db:push (uses DATABASE_URL from .env.local).",
      };
    }
    throw err;
  }
}

function isPostgresMissingRelationError(err: unknown): boolean {
  const code =
    (err as { code?: string })?.code ??
    (err as { cause?: { code?: string } })?.cause?.code;
  if (code === "42P01") return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /relation .* does not exist/i.test(msg);
}

/** Load wizard-shaped input for the edit form (active employees only). */
export async function getEmployeeForEdit(employeeId: string): Promise<
  | { ok: true; employeeId: string; input: CreateEmployeeInput; status: string }
  | { ok: false; error: string }
> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Unauthorized" };

  const row = await getEmployeeRowById(employeeId, userId);
  if (!row) return { ok: false, error: "Not found" };
  if (row.status === "draft") {
    return {
      ok: false,
      error:
        "This row is still a draft — continue from Create Employee, or deploy from the preview step.",
    };
  }

  return {
    ok: true,
    employeeId: row.id,
    input: rowToCreateEmployeeInput(row),
    status: row.status,
  };
}

/**
 * Update name, role, instructions, capabilities, avatar look text.
 * Does not remove `videoPreviewUrl` / identity URLs (patch merge in repository).
 */
export async function updateEmployee(
  employeeId: string,
  input: CreateEmployeeInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Unauthorized" };

  const roleCheck = validateRoleInput(input);
  if (!roleCheck.ok) return roleCheck;

  const row = await getEmployeeRowById(employeeId, userId);
  if (!row) return { ok: false, error: "Not found" };
  if (row.status === "draft") {
    return { ok: false, error: "Use the create flow to edit drafts." };
  }

  const name = ensureVantageName(input.name);
  const role = dbRoleFromInput(input);
  const patch = employeeConfigPatchFromWizard(input);

  try {
    const ok = await updateEmployeeRow({
      employeeId,
      userId,
      name,
      role,
      config: patch,
    });
    if (!ok) return { ok: false, error: "Not found" };
    return { ok: true };
  } catch (err) {
    if (isPostgresMissingRelationError(err)) {
      return {
        ok: false,
        error:
          "Database is missing the employees table. Run npm run db:push from the project root.",
      };
    }
    throw err;
  }
}

/** Hard-delete employee (cascades integrations, knowledge, avatar jobs per schema). */
export async function deleteEmployee(
  employeeId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Unauthorized" };

  try {
    const ok = await deleteEmployeeRow(employeeId, userId);
    if (!ok) return { ok: false, error: "Not found" };
    return { ok: true };
  } catch (err) {
    if (isPostgresMissingRelationError(err)) {
      return {
        ok: false,
        error:
          "Database is missing the employees table. Run npm run db:push from the project root.",
      };
    }
    throw err;
  }
}

/** Workspace integrations + knowledge list for dashboard RSC (auth-scoped). */
export async function getEmployeeWorkspaceIntegrationsData(employeeId: string) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return null;

  const row = await getEmployeeRowById(employeeId, userId);
  if (!row) return null;

  const [integrations, documents] = await Promise.all([
    listClientIntegrationsForEmployee(userId, employeeId),
    listKnowledgeDocumentsForEmployee(userId, employeeId),
  ]);

  return { integrations, documents };
}
