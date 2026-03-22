"use client";

import { Brain, ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export function ThinkingTrace({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  return (
    <Collapsible
      className={cn(
        "group/thought w-full max-w-[min(100%,28rem)]",
        className,
      )}
      defaultOpen={false}
    >
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-left",
          "text-xs text-neutral-400 outline-none transition-colors hover:bg-neutral-900/90",
          "focus-visible:ring-2 focus-visible:ring-violet-500/40",
        )}
      >
        <Brain className="size-3.5 shrink-0 text-violet-400/90" aria-hidden />
        <span className="font-medium text-neutral-300">Thought for a moment</span>
        <ChevronDown
          className="ml-auto size-4 shrink-0 text-neutral-500 transition-transform duration-200 group-data-[state=open]/thought:rotate-180"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 rounded-xl border border-neutral-800/80 bg-neutral-950/80 px-3 py-2.5 text-xs leading-relaxed text-neutral-500">
          <p className="whitespace-pre-wrap">{trimmed}</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
