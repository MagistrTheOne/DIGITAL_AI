import { AppHeader } from "@/components/app/AppHeader";

import { CreateEmployeeWizard } from "@/components/create-employee/CreateEmployeeWizard";

export async function CreateEmployeePage() {
  const avatarPreviewGenerateEnabled = Boolean(
    process.env.ARACHNE_AVATAR_PREVIEW_URL?.trim(),
  );
  const draftPortraitEnabled = Boolean(
    process.env.OPENAI_API_KEY?.trim() &&
      process.env.BLOB_READ_WRITE_TOKEN?.trim(),
  );

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        compact
        title="Create Employee"
        subtitle="Look and role, then name, behavior, and deploy — opens AI Digital on your new employee."
      />
      <CreateEmployeeWizard
        avatarPreviewGenerateEnabled={avatarPreviewGenerateEnabled}
        draftPortraitEnabled={draftPortraitEnabled}
      />
    </div>
  );
}
