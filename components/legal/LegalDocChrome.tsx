import type { ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const DOCS = [
  { href: "/terms", key: "terms" as const, label: "Terms" },
  { href: "/privacy", key: "privacy" as const, label: "Privacy" },
  { href: "/trust", key: "trust" as const, label: "Trust" },
];

export type LegalDocKey = (typeof DOCS)[number]["key"];

export function LegalDocChrome({
  active,
  children,
}: {
  active: LegalDocKey;
  children: ReactNode;
}) {
  return (
    <div className="min-h-svh bg-linear-to-b from-black via-neutral-950/40 to-black text-neutral-300">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/90 shadow-[0_8px_40px_-20px_rgba(0,0,0,0.75)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              href="/home"
              className="text-sm font-semibold tracking-tight text-white transition hover:text-neutral-200"
            >
              NULLXES
            </Link>
            <Link
              href="/home"
              className="text-xs text-neutral-500 transition hover:text-neutral-300"
            >
              ← Marketing site
            </Link>
          </div>
          <nav
            className="flex flex-wrap gap-2"
            aria-label="Legal documents"
          >
            {DOCS.map((d) => (
              <Link
                key={d.href}
                href={d.href}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider transition",
                  active === d.key
                    ? "border-white/25 bg-white/10 text-white"
                    : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-white",
                )}
              >
                {d.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-12 sm:px-6 sm:pt-16">
        <article className="rounded-2xl border border-white/10 bg-neutral-950/50 p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)] sm:p-10 sm:shadow-xl">
          {children}
        </article>

        <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-neutral-600">
          These materials are provided for transparency. Enterprise customers may
          have additional terms in an order form, MSA, or DPA.
        </p>
      </main>
    </div>
  );
}
