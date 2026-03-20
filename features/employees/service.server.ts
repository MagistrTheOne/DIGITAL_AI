import type {
  EmployeeDTO,
  EmployeeListQuery,
  EmployeeRoleCategory,
  EmployeeSessionBootstrapDTO,
} from "@/features/employees/types";

import {
  getEmployeeById,
  listEmployeesByQuery,
} from "@/features/employees/repositories/employees.repository.server";

function toRoleCategory(role: string): EmployeeRoleCategory {
  // Strict mapping to keep UI DTOs stable.
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

function toEmployeeDTO(record: Awaited<ReturnType<typeof getEmployeeById>>): EmployeeDTO | null {
  if (!record) return null;

  return {
    id: record.id,
    name: record.name,
    roleCategory: toRoleCategory(record.role_category),
    verified: record.verified,
    capabilities: [],
    videoPreview: record.video_preview_url
      ? { src: record.video_preview_url, type: "video/mp4" }
      : undefined,
  };
}

export async function getEmployeeDashboardDTOs(input: EmployeeListQuery): Promise<{
  employees: EmployeeDTO[];
}> {
  const records = await listEmployeesByQuery(input);

  // Filtering happens at the repository layer later. For now, do a lightweight
  // pass to make the UI functional even without schema parity.
  const filtered =
    input.role && input.role !== "All"
      ? records.filter((r) => r.role_category === input.role)
      : records;

  const q = input.q?.trim().toLowerCase();
  const searched = q
    ? filtered.filter((r) => r.name.toLowerCase().includes(q))
    : filtered;

  return {
    employees: searched.map((r) => ({
      id: r.id,
      name: r.name,
      roleCategory: toRoleCategory(r.role_category),
      verified: r.verified,
      capabilities: [],
      videoPreview: r.video_preview_url
        ? { src: r.video_preview_url, type: "video/mp4" }
        : undefined,
    })),
  };
}

export async function getEmployeeSessionBootstrap(
  employeeId: string,
): Promise<EmployeeSessionBootstrapDTO> {
  const record = await getEmployeeById(employeeId);
  const employee =
    toEmployeeDTO(record) ?? {
      id: employeeId,
      name: "Unknown Employee",
      roleCategory: "Operations",
      verified: false,
      capabilities: [],
    };

  // BFF contract: short-lived websocket token + websocket url.
  // Real ARACHNE-X token issuing is added later.
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

