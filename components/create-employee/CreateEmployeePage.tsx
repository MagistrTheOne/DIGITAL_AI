import { AppHeader } from "@/components/app/AppHeader";

import { CreateEmployeeWizard } from "@/components/create-employee/CreateEmployeeWizard";

export function CreateEmployeePage() {
  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        compact
        title="Create Employee"
        subtitle="Role, identity, behavior, then deploy."
      />
      <CreateEmployeeWizard />
    </div>
  );
}
