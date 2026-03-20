"use client";

import * as React from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "Message…",
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex shrink-0 gap-2 border-t border-neutral-800 bg-neutral-950/90 p-3 backdrop-blur-sm">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="border-neutral-800 bg-neutral-900/80 text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-neutral-600"
      />
      <Button
        type="button"
        size="icon"
        disabled={disabled || !value.trim()}
        onClick={onSend}
        className="shrink-0 border border-neutral-700 bg-neutral-200 text-neutral-950 hover:bg-neutral-300"
        aria-label="Send message"
      >
        <Send className="size-4" />
      </Button>
    </div>
  );
}
