"use client";

import * as React from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import type { InteractionMessage } from "@/components/employee-interaction/types";

export function ChatMessages({ messages }: { messages: InteractionMessage[] }) {
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <ScrollArea className="min-h-[220px] flex-1 lg:min-h-0">
      <div className="flex flex-col gap-3 p-1 pr-3 pb-2">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-600">
            No messages yet. Type below or use voice when wired.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex w-full",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[min(100%,28rem)] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "rounded-br-md bg-neutral-200 text-neutral-950"
                    : "rounded-bl-md border border-neutral-800 bg-neutral-900/80 text-neutral-200",
                )}
              >
                <span className="sr-only">{m.role === "user" ? "You" : "AI"}</span>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} aria-hidden className="h-px shrink-0" />
      </div>
    </ScrollArea>
  );
}
