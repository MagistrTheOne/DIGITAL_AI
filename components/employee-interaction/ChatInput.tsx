"use client";

import * as React from "react";
import { ImagePlus, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "Message…",
  visionEnabled,
  attachmentDataUrl,
  onAttachmentChange,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  /** Показать кнопку вложения изображения (vision). */
  visionEnabled?: boolean;
  attachmentDataUrl?: string | null;
  onAttachmentChange?: (dataUrl: string | null) => void;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);

  const canSend = Boolean(value.trim() || attachmentDataUrl);

  const submit = () => {
    if (disabled || !canSend) return;
    onSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/") || !onAttachmentChange) return;
    if (file.size > MAX_IMAGE_BYTES) {
      onAttachmentChange(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") onAttachmentChange(r);
    };
    reader.readAsDataURL(file);
  };

  return (
    <form
      className="flex shrink-0 flex-col gap-2 border-t border-neutral-800 bg-neutral-950/90 p-3 backdrop-blur-sm"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {visionEnabled && attachmentDataUrl ? (
        <div className="relative inline-flex w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachmentDataUrl}
            alt=""
            className="h-16 w-16 rounded-lg border border-neutral-700 object-cover"
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute -right-2 -top-2 size-7 rounded-full border border-neutral-700 bg-neutral-900 text-neutral-200"
            onClick={() => onAttachmentChange?.(null)}
            aria-label="Remove image"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : null}
      <div className="flex gap-2">
        {visionEnabled ? (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={onFile}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              disabled={disabled}
              className="shrink-0 border-neutral-700 bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800"
              aria-label="Attach image"
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus className="size-4" />
            </Button>
          </>
        ) : null}
        <Input
          name="message"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className="min-w-0 flex-1 border-neutral-800 bg-neutral-900/80 text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-neutral-600"
        />
        <Button
          type="submit"
          size="icon"
          disabled={disabled || !canSend}
          className="shrink-0 border border-neutral-700 bg-neutral-200 text-neutral-950 hover:bg-neutral-300"
          aria-label="Send message"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </form>
  );
}
