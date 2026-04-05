import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function LegalSection({
  id,
  n,
  title,
  children,
  className,
}: {
  id: string;
  n: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-32 border-t border-white/10 pt-10 sm:pt-12",
        className,
      )}
    >
      <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
        <span className="text-neutral-500">{n}.</span> {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-400 sm:text-base">
        {children}
      </div>
    </section>
  );
}
