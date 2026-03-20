"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";

export function SearchBar({
  initialQuery = "",
  basePath = "/ai-digital",
  placeholder = "Search employees",
  debounceMs = 350,
}: {
  initialQuery?: string;
  basePath?: string;
  placeholder?: string;
  debounceMs?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [value, setValue] = React.useState(initialQuery);
  const didMountRef = React.useRef(false);

  React.useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  React.useEffect(() => {
    // Avoid pushing an identical URL on first render.
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    const handle = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");

      const qs = params.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    }, debounceMs);

    return () => window.clearTimeout(handle);
  }, [basePath, debounceMs, router, searchParams, value]);

  return (
    <Input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
    />
  );
}

