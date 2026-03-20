import type {
  CreateEmployeeInput,
  EmployeeDTO,
  EmployeeListQuery,
  EmployeeRoleCategory,
  EmployeeSessionBootstrapDTO,
} from "@/features/employees/types";

import { getCurrentSession } from "@/lib/auth/session.server";
import { getPlanForUser } from "@/services/db/repositories/billing.repository";
import {
  countEmployeesForUser,
  getEmployeeById,
  insertEmployeeRow,
  listEmployeesByQuery,
} from "@/services/db/repositories/employees.repository";

function toRoleCategory(role: string): EmployeeRoleCategory {
  switch (role) {
    case "CFO":
    case "Marketing":
    case "Operations":
    case "Product":
    case "Customer Support":
      return role;
    default:
      return "Operations";
  }
}

function toEmployeeDTO(
  record: Awaited<ReturnType<typeof getEmployeeById>>,
): EmployeeDTO | null {
  if (!record) return null;

  return {
    id: record.id,
    name: record.name,
    roleCategory: toRoleCategory(record.role_category),
    verified: record.verified,
    capabilities: record.capabilities,
    videoPreview: record.video_preview_url
      ? { src: record.video_preview_url, type: "video/mp4" }
      : undefined,
  };
}

function ensureVantageName(raw: string): string {
  const t = raw.trim();
  if (!t) return "Agent Vantage";
  return t.toLowerCase().endsWith("vantage") ? t : `${t} Vantage`;
}

export async function getEmployeeDashboardDTOs(input: EmployeeListQuery): Promise<{
  employees: EmployeeDTO[];
}> {
  const records = await listEmployeesByQuery(input);

  return {
    employees: records.map((r) => ({
      id: r.id,
      name: r.name,
      roleCategory: toRoleCategory(r.role_category),
      verified: r.verified,
      capabilities: r.capabilities,
      videoPreview: r.video_preview_url
        ? { src: r.video_preview_url, type: "video/mp4" }
        : undefined,
    })),
  };
}

export async function getEmployeeSessionBootstrap(
  employeeId: string,
): Promise<EmployeeSessionBootstrapDTO> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  const record = await getEmployeeById(employeeId, userId);

  const employee =
    toEmployeeDTO(record) ?? {
      id: employeeId,
      name: "Unknown Employee",
      roleCategory: "Operations",
      verified: false,
      capabilities: [],
    };

  return {
    sessionId: `sess_${employeeId}`,
    employee,
    websocket: {
      url: "/api/arachine-x/ws",
      token: "dev-token",
    },
    capabilities: employee.capabilities,
  };
}

/**
 * Create a new AI employee — plan cap enforced before insert.
 */
export async function createEmployee(
  input: CreateEmployeeInput,
): Promise<{ ok: true; employeeId: string } | { ok: false; error: string }> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Unauthorized" };

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

  try {
    const { id } = await insertEmployeeRow({
      userId,
      name,
      role: input.role,
      status: "active",
      config: {
        prompt: input.prompt,
        capabilities: input.capabilities,
        avatarPlaceholder: input.avatarPlaceholder ?? null,
      },
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

function isPostgresMissingRelationError(err: unknown): boolean {
  const code =
    (err as { code?: string })?.code ??
    (err as { cause?: { code?: string } })?.cause?.code;
  if (code === "42P01") return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /relation .* does not exist/i.test(msg);
}
