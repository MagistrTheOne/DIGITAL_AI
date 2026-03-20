import { redirect } from "next/navigation";

import { SettingsPage } from "@/components/settings/SettingsPage";
import { getSettingsDTO } from "@/features/settings/service.server";

export default async function SettingsRoutePage() {
  const dto = await getSettingsDTO();
  if (!dto) redirect("/sign-in");

  return (
    <div className="flex flex-col gap-6 bg-neutral-950 p-6">
      <SettingsPage initialData={dto} />
    </div>
  );
}
