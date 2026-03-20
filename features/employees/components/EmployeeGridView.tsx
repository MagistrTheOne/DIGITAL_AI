import * as React from "react";

import type { EmployeeListQuery } from "@/features/employees/types";
import { getEmployeeDashboardDTOs } from "@/features/employees/service.server";
import { EmployeeCard } from "@/components/employees/EmployeeCard";

export default async function EmployeeGridView({
  query,
}: {
  query: EmployeeListQuery;
}) {
  const { employees } = await getEmployeeDashboardDTOs(query);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {employees.map((employee) => (
        <EmployeeCard key={employee.id} employee={employee} />
      ))}
    </div>
  );
}

