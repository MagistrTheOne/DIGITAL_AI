"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PILLARS = [
  {
    id: "isolation",
    title: "Isolation",
    body: "Video and avatar surfaces stay swappable so realtime engines can land later without rewiring product.",
  },
  {
    id: "server-first",
    title: "Server-first",
    body: "Auth, billing, and inference orchestration stay on the server; the client stays thin and fast.",
  },
  {
    id: "scale",
    title: "Scale path",
    body: "From exploration to production tiers with clear throughput and operational boundaries.",
  },
] as const;

export function LandingArchitectureCards() {
  const [selected, setSelected] = React.useState<string>(PILLARS[0]!.id);

  return (
    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
      {PILLARS.map((p) => {
        const isSelected = selected === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelected(p.id)}
            className={cn(
              "group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
            )}
            aria-pressed={isSelected}
          >
            <Card
              size="sm"
              className={cn(
                "h-full min-h-[220px] border-white/10 bg-neutral-950/75 py-0 text-neutral-100 shadow-none ring-1 ring-transparent transition-[border-color,box-shadow,transform] duration-200",
                "group-hover:border-white/18",
                isSelected &&
                  "border-white/22 ring-white/15 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.85)] sm:scale-[1.01]",
              )}
            >
              <CardHeader className="border-b border-white/10 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base font-semibold text-white">
                    {p.title}
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "shrink-0 border text-[10px] font-medium uppercase tracking-wider",
                      isSelected
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-white/10 bg-black/40 text-neutral-500",
                    )}
                  >
                    {isSelected ? "Selected" : "Select"}
                  </Badge>
                </div>
                <CardDescription
                  className={cn(
                    "pt-3 text-sm leading-relaxed",
                    isSelected ? "text-neutral-200" : "text-neutral-500",
                  )}
                >
                  {p.body}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pb-5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-600">
                  Architecture pillar
                </p>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
