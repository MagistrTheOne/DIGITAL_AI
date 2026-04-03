import { redirect } from "next/navigation";

import { SettingsPage } from "@/components/settings/SettingsPage";
import { getSettingsDTO } from "@/features/settings/service.server";

export default async function SettingsRoutePage() {
  const dto = await getSettingsDTO();
  if (!dto) redirect("/sign-in");

  return (
    <div className="flex flex-col gap-4 p-4 md:p-5">
      <SettingsPage initialData={dto} />
    </div>
  );
}
