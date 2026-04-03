"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import type { EmployeeOpenAiChatSession } from "@/features/employees/employeeOpenAiSessions.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function EmployeeOpenAiSessionsSidebar({
  sessions,
  activeSessionId,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: {
  sessions: EmployeeOpenAiChatSession[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editDraft, setEditDraft] = React.useState("");

  const sorted = React.useMemo(
    () => [...sessions].sort((a, b) => b.updatedAt - a.updatedAt),
    [sessions],
  );

  const startRename = (s: EmployeeOpenAiChatSession) => {
    setEditingId(s.id);
    setEditDraft(s.title);
  };

  const commitRename = () => {
    if (editingId) onRename(editingId, editDraft);
    setEditingId(null);
  };

  return (
    <aside className="flex w-[min(100%,13.5rem)] shrink-0 flex-col border-l border-neutral-800 bg-neutral-950/50 lg:w-56">
      <div className="flex items-center justify-between gap-1 border-b border-neutral-800 px-2 py-2">
        <span className="truncate px-1 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
          Chats
        </span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7 shrink-0 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
          onClick={onNew}
          aria-label="New chat"
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <ul className="flex flex-col gap-0.5 p-1.5 pb-4">
          {sorted.map((s) => (
            <li key={s.id}>
              {editingId === s.id ? (
                <Input
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitRename();
                    }
                    if (e.key === "Escape") {
                      setEditingId(null);
                    }
                  }}
                  className="h-8 border-neutral-700 bg-neutral-900 text-xs text-neutral-100"
                  autoFocus
                />
              ) : (
                <div
                  className={cn(
                    "group flex items-center gap-0.5 rounded-md border border-transparent",
                    s.id === activeSessionId
                      ? "bg-neutral-800/90"
                      : "hover:bg-neutral-900/80",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(s.id)}
                    className="min-w-0 flex-1 truncate px-2 py-2 text-left text-xs text-neutral-300"
                  >
                    {s.title}
                  </button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0 opacity-0 group-hover:opacity-100"
                    aria-label="Rename chat"
                    onClick={() => startRename(s)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0 text-neutral-500 opacity-0 group-hover:opacity-100 hover:text-red-400"
                    aria-label="Delete chat"
                    onClick={() => {
                      if (
                        typeof window !== "undefined" &&
                        !window.confirm("Delete this chat and its history?")
                      ) {
                        return;
                      }
                      onDelete(s.id);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </ScrollArea>
    </aside>
  );
}
