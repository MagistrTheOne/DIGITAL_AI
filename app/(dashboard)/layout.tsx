import * as React from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/AppShell";
import { requireUser } from "@/lib/auth/session.server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-only gate: ensure authenticated access to the dashboard shell.
  const user = await requireUser();
  if (!user) redirect("/sign-in");

  return <AppShell>{children}</AppShell>;
}

