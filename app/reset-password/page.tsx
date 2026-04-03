import * as React from "react";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center p-6 text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <ResetPasswordForm />
    </React.Suspense>
  );
}
