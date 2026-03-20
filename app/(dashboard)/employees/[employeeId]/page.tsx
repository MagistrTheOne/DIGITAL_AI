import type { EmployeeSessionBootstrapDTO } from "@/features/employees/types";
import { getEmployeeSessionBootstrap } from "@/features/employees/service.server";
import { EmployeeSessionRuntime } from "@/features/employees/components/session/EmployeeSessionRuntime";

export default async function EmployeeInteractionPage({
  params,
}: {
  params: { employeeId: string };
}) {
  const bootstrap: EmployeeSessionBootstrapDTO =
    await getEmployeeSessionBootstrap(params.employeeId);

  return (
    <div className="flex min-h-[60vh] flex-col p-6">
      <EmployeeSessionRuntime bootstrap={bootstrap} />
    </div>
  );
}

