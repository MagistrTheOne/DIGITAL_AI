import { EmployeeGrid } from "@/components/employees/EmployeeGrid";
import { getEmployeesForDashboard } from "@/features/employees/service.server";

export default async function AiDigitalPage() {
  const { employees } = await getEmployeesForDashboard();

  return (
    <div className="flex flex-col gap-6 p-6">
      <EmployeeGrid employees={employees} />
    </div>
  );
}
