"use client";

import * as React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function FilterTabs({
  value,
  onValueChange,
  items,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  items: Array<{ value: string; label: string }>;
  className?: string;
}) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className={cn("w-full", className)}>
      <TabsList
        variant="line"
        className="h-auto w-full min-w-0 flex-wrap justify-start gap-0 rounded-none border-b border-neutral-800 bg-transparent p-0"
      >
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className="text-neutral-500 data-[state=active]:border-b-2 data-[state=active]:border-neutral-200 data-[state=active]:text-neutral-200"
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value} className="mt-0 hidden" />
      ))}
    </Tabs>
  );
}
