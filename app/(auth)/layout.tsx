import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth/session.server";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();
  if (session?.user?.id) {
    redirect("/ai-digital");
  }

  return <>{children}</>;
}
