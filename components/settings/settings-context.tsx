"use client";

import * as React from "react";

import type { SettingsDTO } from "@/features/settings/types";

const SettingsContext = React.createContext<SettingsDTO | null>(null);

export function SettingsProvider({
  value,
  children,
}: {
  value: SettingsDTO;
  children: React.ReactNode;
}) {
  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettingsDto(): SettingsDTO {
  const ctx = React.useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettingsDto must be used within SettingsProvider");
  }
  return ctx;
}
