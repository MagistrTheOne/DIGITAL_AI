"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const CASES = [
  {
    id: "hr",
    title: "HR",
    body: "Policy Q&A, intake screening, and consistent answers across time zones — without multiplying headcount.",
  },
  {
    id: "onboarding",
    title: "Onboarding",
    body: "Role-specific walkthroughs, knowledge transfer, and session trails new hires can revisit.",
  },
  {
    id: "support",
    title: "Support & ops",
    body: "Tier-1 triage, runbooks, and escalation paths that stay on-brand while latency stays low.",
  },
  {
    id: "sales",
    title: "Sales & success",
    body: "Discovery prep, follow-ups, and recap artifacts tied to your CRM workflows (via integrations).",
  },
] as const;

export function LandingUseCaseCards() {
  const [selected, setSelected] = React.useState<string>(CASES[0]!.id);
  const [tilt, setTilt] = React.useState<Record<string, { rx: number; ry: number }>>(
    {},
  );

  const onCardMove = (id: string, e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt((prev) => ({
      ...prev,
      [id]: { rx: py * -10, ry: px * 10 },
    }));
  };

  const onCardLeave = (id: string) => {
    setTilt((prev) => ({ ...prev, [id]: { rx: 0, ry: 0 } }));
  };

  return (
    <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:gap-10">
      {CASES.map((c) => {
        const isSelected = selected === c.id;
        const t = tilt[c.id] ?? { rx: 0, ry: 0 };
        return (
          <div
            key={c.id}
            className="mx-auto w-full max-w-md"
            style={{ perspective: "1200px" }}
          >
            <button
              type="button"
              onClick={() => setSelected(c.id)}
              onPointerMove={(e) => onCardMove(c.id, e)}
              onPointerLeave={() => onCardLeave(c.id)}
              className={cn(
                "w-full origin-center rounded-2xl border text-left transition-[box-shadow,transform,border-color] duration-200 transform-3d will-change-transform",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                isSelected
                  ? "border-white/25 bg-white/6 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.08)_inset]"
                  : "border-white/10 bg-black/40 shadow-none hover:border-white/18",
              )}
              style={{
                transform: `rotateX(${t.rx}deg) rotateY(${t.ry}deg) scale(${isSelected ? 1.02 : 1})`,
              }}
              aria-pressed={isSelected}
              aria-expanded={isSelected}
            >
              <div className="px-6 py-6 sm:px-7 sm:py-7">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-lg font-semibold tracking-tight text-white">
                    {c.title}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                      isSelected
                        ? "border-white/35 text-white"
                        : "border-white/15 text-neutral-500",
                    )}
                  >
                    {isSelected ? "Selected" : "Select"}
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-4 text-sm leading-relaxed transition-opacity duration-200",
                    isSelected ? "text-neutral-200" : "text-neutral-500 line-clamp-3 sm:line-clamp-2",
                  )}
                >
                  {c.body}
                </p>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
