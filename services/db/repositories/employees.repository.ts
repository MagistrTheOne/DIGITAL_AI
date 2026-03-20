import { randomUUID } from "node:crypto";

import { and, count, eq } from "drizzle-orm";

import { db } from "@/db";
import { employee } from "@/db/schema";

import type {
  EmployeeId,
  EmployeeListQuery,
} from "@/features/employees/types";

/** Persistence shape — feature/UI map to DTOs. */
export type EmployeeRecord = {
  id: EmployeeId;
  name: string;
  role_category: string;
  verified: boolean;
  video_preview_url: string | null;
  capabilities: string[];
};

type EmployeeConfigJson = {
  prompt?: string;
  capabilities?: string[];
  avatarPlaceholder?: string | null;
  videoPreviewUrl?: string | null;
};

function mapRow(r: typeof employee.$inferSelect): EmployeeRecord {
  const cfg = (r.config ?? {}) as EmployeeConfigJson;
  const caps = Array.isArray(cfg.capabilities)
    ? cfg.capabilities.filter((x): x is string => typeof x === "string")
    : [];
  return {
    id: r.id,
    name: r.name,
    role_category: r.role,
    verified: r.status === "active",
    video_preview_url:
      typeof cfg.videoPreviewUrl === "string" ? cfg.videoPreviewUrl : null,
    capabilities: caps,
  };
}

export async function listEmployeesByQuery(
  query: EmployeeListQuery,
): Promise<EmployeeRecord[]> {
  if (!query.userId) return [];

  try {
    const conditions = [eq(employee.userId, query.userId)];

    const rows = await db
      .select()
      .from(employee)
      .where(and(...conditions))
      .orderBy(employee.name);

    let out = rows.map(mapRow);

    if (query.role && query.role !== "All") {
      out = out.filter((r) => r.role_category === query.role);
    }

    const q = query.q?.trim().toLowerCase();
    if (q) {
      out = out.filter((r) => r.name.toLowerCase().includes(q));
    }

    return out.slice(0, 60);
  } catch {
    return [];
  }
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

export async function countEmployeesForUser(userId: string): Promise<number> {
  try {
    const [row] = await db
      .select({ c: count() })
      .from(employee)
      .where(eq(employee.userId, userId));
    return Number(row?.c ?? 0);
  } catch {
    return 0;
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
