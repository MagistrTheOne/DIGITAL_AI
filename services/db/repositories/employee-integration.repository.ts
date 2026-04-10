import { randomUUID } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/services/db/client";
import { employeeIntegration } from "@/db/schema";
import type { ClientApiIntegrationConfig } from "@/lib/integrations/client-api-config.types";

export type EmployeeIntegrationRow = typeof employeeIntegration.$inferSelect;

export type ClientApiIntegrationPublic = {
  id: string;
  name: string;
  kind: string;
  enabled: boolean;
  baseUrl: string;
  pathPrefix?: string;
  allowedMethods: string[];
  lastError: string | null;
  createdAt: Date;
};

function toPublicConfig(
  config: unknown,
): Omit<ClientApiIntegrationPublic, "id" | "name" | "kind" | "enabled" | "lastError" | "createdAt"> {
  const c = (config ?? {}) as ClientApiIntegrationConfig;
  const baseUrl = typeof c.baseUrl === "string" ? c.baseUrl : "";
  return {
    baseUrl,
    pathPrefix: typeof c.pathPrefix === "string" ? c.pathPrefix : undefined,
    allowedMethods: Array.isArray(c.allowedMethods)
      ? c.allowedMethods.filter((x): x is string => typeof x === "string")
      : ["GET", "POST", "PATCH", "PUT"],
  };
}

export function mapIntegrationToPublic(
  row: EmployeeIntegrationRow,
): ClientApiIntegrationPublic {
  const cfg = toPublicConfig(row.config);
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    enabled: row.enabled,
    lastError: row.lastError,
    createdAt: row.createdAt,
    ...cfg,
  };
}

export async function listClientIntegrationsForEmployee(
  userId: string,
  employeeId: string,
): Promise<ClientApiIntegrationPublic[]> {
  const rows = await db
    .select()
    .from(employeeIntegration)
    .where(
      and(
        eq(employeeIntegration.userId, userId),
        eq(employeeIntegration.employeeId, employeeId),
        eq(employeeIntegration.kind, "client_api"),
      ),
    )
    .orderBy(desc(employeeIntegration.createdAt));
  return rows.map(mapIntegrationToPublic);
}

export async function getClientIntegrationForOwner(
  userId: string,
  employeeId: string,
  integrationId: string,
): Promise<EmployeeIntegrationRow | null> {
  const [row] = await db
    .select()
    .from(employeeIntegration)
    .where(
      and(
        eq(employeeIntegration.id, integrationId),
        eq(employeeIntegration.userId, userId),
        eq(employeeIntegration.employeeId, employeeId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function insertClientIntegration(input: {
  userId: string;
  employeeId: string;
  name: string;
  config: ClientApiIntegrationConfig;
  secretCiphertext: string;
}): Promise<EmployeeIntegrationRow> {
  const id = randomUUID();
  const now = new Date();
  const [row] = await db
    .insert(employeeIntegration)
    .values({
      id,
      userId: input.userId,
      employeeId: input.employeeId,
      kind: "client_api",
      name: input.name.trim(),
      config: input.config,
      secretCiphertext: input.secretCiphertext,
      enabled: true,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!row) throw new Error("insert_failed");
  return row;
}

export async function updateClientIntegration(
  userId: string,
  employeeId: string,
  integrationId: string,
  patch: {
    name?: string;
    enabled?: boolean;
    config?: ClientApiIntegrationConfig;
    secretCiphertext?: string;
    lastError?: string | null;
  },
): Promise<EmployeeIntegrationRow | null> {
  const existing = await getClientIntegrationForOwner(
    userId,
    employeeId,
    integrationId,
  );
  if (!existing) return null;

  const [row] = await db
    .update(employeeIntegration)
    .set({
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
      ...(patch.config !== undefined ? { config: patch.config } : {}),
      ...(patch.secretCiphertext !== undefined
        ? { secretCiphertext: patch.secretCiphertext }
        : {}),
      ...(patch.lastError !== undefined ? { lastError: patch.lastError } : {}),
      updatedAt: new Date(),
    })
    .where(eq(employeeIntegration.id, integrationId))
    .returning();
  return row ?? null;
}

export async function deleteClientIntegration(
  userId: string,
  employeeId: string,
  integrationId: string,
): Promise<boolean> {
  const existing = await getClientIntegrationForOwner(
    userId,
    employeeId,
    integrationId,
  );
  if (!existing) return false;
  await db
    .delete(employeeIntegration)
    .where(eq(employeeIntegration.id, integrationId));
  return true;
}
