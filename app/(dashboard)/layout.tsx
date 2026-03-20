import * as React from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/AppShell";
import { getAccountDashboardDTO } from "@/features/account/service.server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const account = await getAccountDashboardDTO();
  if (!account) redirect("/sign-in");

  return <AppShell account={account}>{children}</AppShell>;
}

