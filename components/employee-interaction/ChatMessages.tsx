"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import type { InteractionMessage } from "@/components/employee-interaction/types";
import { ThinkingTrace } from "@/components/employee-interaction/ThinkingTrace";

function scrollElementToBottom(el: HTMLElement | null, behavior: ScrollBehavior) {
  if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior });
}

export function ChatMessages({
  messages,
  busy,
  hideEmptyPlaceholder,
}: {
  messages: InteractionMessage[];
  /** Идёт запрос к оркестратору (ARACHNE-X). */
  busy?: boolean;
  /** Не показывать подсказку «No messages yet…» (пустой чат до первого сообщения). */
  hideEmptyPlaceholder?: boolean;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const run = () =>
      scrollElementToBottom(scrollRef.current, busy ? "auto" : "smooth");
    run();
    const id = requestAnimationFrame(() => requestAnimationFrame(run));
    return () => cancelAnimationFrame(id);
  }, [messages, busy]);

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-relevant="additions"
      aria-label="Chat messages"
      className={cn(
        "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain",
        "[scrollbar-gutter:stable]",
      )}
    >
      <div className="flex flex-col gap-3 p-1 pr-3 pb-2">
        {messages.length === 0 ? (
          hideEmptyPlaceholder ? (
            <div className="min-h-[120px] shrink-0" aria-hidden />
          ) : (
            <p className="py-8 text-center text-sm text-neutral-600">
              No messages yet. Type below, attach an image for vision, or use voice when
              wired.
            </p>
          )
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex w-full flex-col gap-1",
                m.role === "user" ? "items-end" : "items-start",
              )}
            >
              {m.role === "assistant" && m.thinking ? (
                <ThinkingTrace text={m.thinking} />
              ) : null}
              <div
                className={cn(
                  "max-w-[min(100%,28rem)] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "rounded-br-md bg-neutral-200 text-neutral-950"
                    : "rounded-bl-md border border-neutral-800 bg-neutral-900/80 text-neutral-200",
                )}
              >
                <span className="sr-only">{m.role === "user" ? "You" : "AI"}</span>
                {m.role === "user" && m.imageUrls?.length ? (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {m.imageUrls.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={`${m.id}-img-${i}`}
                        src={src}
                        alt=""
                        className="max-h-40 max-w-full rounded-md border border-neutral-400/40 object-contain"
                      />
                    ))}
                  </div>
                ) : null}
                {m.content.trim() ? (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                ) : m.role === "user" && m.imageUrls?.length ? (
                  <p className="text-xs text-neutral-600">(image)</p>
                ) : null}
                {m.role === "assistant" && m.status === "streaming" ? (
                  <span className="mt-1 inline-block h-2 w-2 animate-pulse rounded-full bg-violet-400/80" />
                ) : null}
              </div>
            </div>
          ))
        )}
        {busy ? (
          <p className="text-center text-xs text-neutral-600">Thinking…</p>
        ) : null}
        <div aria-hidden className="h-px shrink-0" />
      </div>
    </div>
  );
}
