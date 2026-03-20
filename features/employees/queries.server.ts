import type { EmployeeListQuery, EmployeeSessionBootstrapDTO, EmployeeDTO } from "@/features/employees/types";
import { getEmployeeDashboardDTOs, getEmployeeSessionBootstrap } from "@/features/employees/service.server";

export async function getEmployeesDashboard(query: EmployeeListQuery): Promise<{ employees: EmployeeDTO[] }> {
  return getEmployeeDashboardDTOs(query);
}

export async function getEmployeeSessionBootstrapDTO(employeeId: string): Promise<EmployeeSessionBootstrapDTO> {
  return getEmployeeSessionBootstrap(employeeId);
}

