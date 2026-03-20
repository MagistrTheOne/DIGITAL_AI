import * as React from "react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
      <div className="max-w-md text-center">
        <div className="text-2xl font-semibold">Sign in</div>
        <div className="mt-2 text-sm text-muted-foreground">
          Auth UI placeholder. Integrate Better Auth email OTP flow next.
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="rounded-md border bg-background px-4 py-2 text-sm hover:bg-muted"
        >
          Back to app
        </Link>
        <Link
          href="/sign-up"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

