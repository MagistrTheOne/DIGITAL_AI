import { AppHeader } from "@/components/app/AppHeader";

import { CreateEmployeeWizard } from "@/components/create-employee/CreateEmployeeWizard";

export async function CreateEmployeePage() {
  const avatarPreviewGenerateEnabled = Boolean(
    process.env.ARACHNE_AVATAR_PREVIEW_URL?.trim(),
  );

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        compact
        title="Create Employee"
        subtitle="Role, identity, behavior, then deploy."
      />
      <CreateEmployeeWizard avatarPreviewGenerateEnabled={avatarPreviewGenerateEnabled} />
    </div>
  );
}
