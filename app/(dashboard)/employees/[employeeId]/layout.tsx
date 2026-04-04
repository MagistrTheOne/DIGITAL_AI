import * as React from "react";

/**
 * Viewport-height shell scroll is disabled under /employees/* in AppShell; this
 * layout keeps the subtree flex-bounded so only the transcript (ChatMessages) scrolls.
 */
export default function EmployeeDetailLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {children}
    </div>
  );
}
