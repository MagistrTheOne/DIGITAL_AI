import { AppHeader } from "@/components/app/AppHeader";

import { CreateEmployeeWizard } from "@/components/create-employee/CreateEmployeeWizard";

export function CreateEmployeePage() {
  return (
    <div className="flex flex-col gap-6">
      <AppHeader
        title="Create Employee"
        subtitle="Onboard a new digital workforce member"
      />
      <CreateEmployeeWizard />
    </div>
  );
}
