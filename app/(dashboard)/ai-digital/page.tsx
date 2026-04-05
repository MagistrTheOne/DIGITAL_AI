import { EmployeeGrid } from "@/components/employees/EmployeeGrid";
import { getEmployeesForDashboard } from "@/features/employees/service.server";

export default async function AiDigitalPage({
  searchParams,
}: {
  searchParams: Promise<{ employee?: string }>;
}) {
  const { employees } = await getEmployeesForDashboard();
  const sp = await searchParams;
  const highlightId =
    typeof sp.employee === "string" ? sp.employee.trim() || null : null;

  return (
    <div className="flex flex-col gap-6 p-6">
      <EmployeeGrid
        employees={employees}
        highlightEmployeeId={highlightId}
      />
    </div>
  );
}
