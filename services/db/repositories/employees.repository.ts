import { randomUUID } from "node:crypto";

import { and, count, eq, ne, sql } from "drizzle-orm";

import { db } from "@/services/db/client";
import { employee } from "@/db/schema";

import type { RenderStatus } from "@/features/employees/avatar-preview.types";
import type {
  EmployeeId,
  EmployeeListQuery,
} from "@/features/employees/types";

/** Persistence shape — feature/UI map to DTOs. */
export type EmployeeRecord = {
  id: EmployeeId;
  name: string;
  role_category: string;
  /** Shown in UI: custom job title when role column is Other. */
  role_label: string;
  verified: boolean;
  video_preview_url: string | null;
  capabilities: string[];
  avatar_render_status: RenderStatus;
  avatar_preview_job_id: string | null;
  avatar_preview_error: string | null;
  /** Optional https reference image for InfiniteTalk identity / sessions. */
  identity_reference_image_url: string | null;
  /** Wizard / config free-text; may include https URL for reference. */
  avatar_placeholder: string | null;
};

export type EmployeeConfigJson = {
  prompt?: string;
  capabilities?: string[];
  avatarPlaceholder?: string | null;
  /** One-shot / loop preview clip (mp4), durable URL (e.g. Blob). Session segments reuse this + TTS audio. */
  videoPreviewUrl?: string | null;
  /**
   * Still image (https) for InfiniteTalk / lip-sync reference — required for reliable Hub API
   * (do not pass mp4 here). Set by “Create identity clip” after user uploads or confirms photo.
   */
  identityReferenceImageUrl?: string | null;
  /** Prompt template revision used when identity clip was generated; bump to force re-shoot. */
  identityClipPromptTemplateVersion?: number;
  /** Hash of (reference image + intro text + engine + size) for idempotent regen / cache. */
  identityClipInputHash?: string | null;
  /** ISO timestamp when identity clip was written to `videoPreviewUrl`. */
  identityClipGeneratedAt?: string | null;
  /** Which path produced the stored identity clip. */
  identityClipEngine?: "infinitetalk" | "runpod_preview" | "arachne_http";
  roleCustomTitle?: string | null;
  avatarRenderStatus?: RenderStatus | null;
  avatarPreviewJobId?: string | null;
  avatarPreviewError?: string | null;
  avatarGenerationRequestedAt?: string | null;
  promptTemplateVersion?: number;
  renderProfile?: Record<string, unknown>;
};

function defaultRenderStatus(cfg: EmployeeConfigJson): RenderStatus {
  if (cfg.avatarRenderStatus === "generating") return "generating";
  if (cfg.avatarRenderStatus === "failed") return "failed";
  if (cfg.avatarRenderStatus === "ready") return "ready";
  if (cfg.avatarRenderStatus === "idle") return "idle";
  if (typeof cfg.videoPreviewUrl === "string" && cfg.videoPreviewUrl.length > 0) {
    return "ready";
  }
  return "idle";
}

function mapRow(r: typeof employee.$inferSelect): EmployeeRecord {
  const cfg = (r.config ?? {}) as EmployeeConfigJson;
  const caps = Array.isArray(cfg.capabilities)
    ? cfg.capabilities.filter((x): x is string => typeof x === "string")
    : [];
  const videoUrl =
    typeof cfg.videoPreviewUrl === "string" ? cfg.videoPreviewUrl : null;
  const roleLabel =
    r.role === "Other" && typeof cfg.roleCustomTitle === "string" && cfg.roleCustomTitle.trim()
      ? cfg.roleCustomTitle.trim()
      : r.role;

  const identityRef =
    typeof cfg.identityReferenceImageUrl === "string"
      ? cfg.identityReferenceImageUrl.trim()
      : "";
  const placeholder =
    typeof cfg.avatarPlaceholder === "string" ? cfg.avatarPlaceholder.trim() : "";

  return {
    id: r.id,
    name: r.name,
    role_category: r.role,
    role_label: roleLabel,
    verified: r.status === "active",
    video_preview_url: videoUrl,
    capabilities: caps,
    avatar_render_status: defaultRenderStatus(cfg),
    avatar_preview_job_id:
      typeof cfg.avatarPreviewJobId === "string" ? cfg.avatarPreviewJobId : null,
    avatar_preview_error:
      typeof cfg.avatarPreviewError === "string" ? cfg.avatarPreviewError : null,
    identity_reference_image_url: identityRef || null,
    avatar_placeholder: placeholder || null,
  };
}

/** All employees for a user (ordered by name), excluding drafts. */
export async function listEmployeesByUser(
  userId: string,
): Promise<EmployeeRecord[]> {
  if (!userId) return [];

  try {
    const rows = await db
      .select()
      .from(employee)
      .where(and(eq(employee.userId, userId), ne(employee.status, "draft")))
      .orderBy(employee.name);

    return rows.map(mapRow);
  } catch {
    return [];
  }
}

export async function listEmployeesByQuery(
  query: EmployeeListQuery,
): Promise<EmployeeRecord[]> {
  if (!query.userId) return [];

  let out = await listEmployeesByUser(query.userId);

  if (query.role && query.role !== "All") {
    out = out.filter((r) => r.role_category === query.role);
  }

  const q = query.q?.trim().toLowerCase();
  if (q) {
    out = out.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.role_label.toLowerCase().includes(q),
    );
  }

  return out.slice(0, 60);
}

export async function getEmployeeById(
  employeeId: EmployeeId,
  userId?: string,
): Promise<EmployeeRecord | null> {
  try {
    const conditions = [eq(employee.id, employeeId)];
    if (userId) conditions.push(eq(employee.userId, userId));

    const [row] = await db
      .select()
      .from(employee)
      .where(and(...conditions))
      .limit(1);

    return row ? mapRow(row) : null;
  } catch {
    return null;
  }
}

/** Full DB row (e.g. chat / mint routes need `config` JSON). */
export async function getEmployeeRowById(
  employeeId: EmployeeId,
  userId?: string,
): Promise<typeof employee.$inferSelect | null> {
  try {
    const conditions = [eq(employee.id, employeeId)];
    if (userId) conditions.push(eq(employee.userId, userId));

    const [row] = await db
      .select()
      .from(employee)
      .where(and(...conditions))
      .limit(1);

    return row ?? null;
  } catch {
    return null;
  }
}

/** Count **active** employees only (excludes draft) — used for plan limits. */
export async function countEmployeesForUser(userId: string): Promise<number> {
  try {
    const [row] = await db
      .select({ c: count() })
      .from(employee)
      .where(and(eq(employee.userId, userId), eq(employee.status, "active")));
    return Number(row?.c ?? 0);
  } catch {
    return 0;
  }
}

export type AvatarPreviewStatePatch = {
  avatarRenderStatus?: RenderStatus | null;
  avatarPreviewJobId?: string | null;
  avatarPreviewError?: string | null;
  videoPreviewUrl?: string | null;
};

export async function updateEmployeeAvatarPreviewState(
  employeeId: EmployeeId,
  userId: string,
  patch: AvatarPreviewStatePatch,
): Promise<boolean> {
  const row = await getEmployeeRowById(employeeId, userId);
  if (!row) return false;

  const prev = (row.config ?? {}) as EmployeeConfigJson;
  const config: EmployeeConfigJson = { ...prev };

  if (patch.avatarRenderStatus !== undefined) {
    config.avatarRenderStatus = patch.avatarRenderStatus ?? undefined;
  }
  if (patch.avatarPreviewJobId !== undefined) {
    config.avatarPreviewJobId = patch.avatarPreviewJobId;
  }
  if (patch.avatarPreviewError !== undefined) {
    config.avatarPreviewError = patch.avatarPreviewError;
  }
  if (patch.videoPreviewUrl !== undefined) {
    config.videoPreviewUrl = patch.videoPreviewUrl;
  }

  await db
    .update(employee)
    .set({
      config: config as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(and(eq(employee.id, employeeId), eq(employee.userId, userId)));

  return true;
}

/** Merge `videoPreviewUrl` and mark preview ready (sync path). */
export async function updateEmployeeVideoPreviewUrl(
  employeeId: EmployeeId,
  userId: string,
  videoPreviewUrl: string,
): Promise<boolean> {
  return updateEmployeeAvatarPreviewState(employeeId, userId, {
    videoPreviewUrl: videoPreviewUrl.trim(),
    avatarRenderStatus: "ready",
    avatarPreviewJobId: null,
    avatarPreviewError: null,
  });
}

export async function findEmployeeRowByPreviewJobId(
  userId: string,
  jobId: string,
): Promise<typeof employee.$inferSelect | null> {
  if (!userId || !jobId.trim()) return null;
  try {
    const [row] = await db
      .select()
      .from(employee)
      .where(
        and(
          eq(employee.userId, userId),
          sql`${employee.config}->>'avatarPreviewJobId' = ${jobId}`,
        ),
      )
      .limit(1);
    return row ?? null;
  } catch {
    return null;
  }
}

export async function insertEmployeeRow(input: {
  userId: string;
  name: string;
  role: string;
  status: string;
  config: EmployeeConfigJson;
}): Promise<{ id: string }> {
  const id = `emp_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const now = new Date();

  await db.insert(employee).values({
    id,
    userId: input.userId,
    name: input.name,
    role: input.role,
    status: input.status,
    config: input.config as Record<string, unknown>,
    createdAt: now,
    updatedAt: now,
  });

  return { id };
}

export async function updateEmployeeRow(input: {
  employeeId: EmployeeId;
  userId: string;
  name?: string;
  role?: string;
  status?: string;
  config?: Partial<EmployeeConfigJson>;
}): Promise<boolean> {
  const row = await getEmployeeRowById(input.employeeId, input.userId);
  if (!row) return false;

  const prev = (row.config ?? {}) as EmployeeConfigJson;
  const nextConfig: EmployeeConfigJson = input.config
    ? { ...prev, ...input.config }
    : prev;

  await db
    .update(employee)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      config: nextConfig as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(
      and(eq(employee.id, input.employeeId), eq(employee.userId, input.userId)),
    );

  return true;
}
