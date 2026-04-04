"use client";

import * as React from "react";

import { RealtimePanel } from "@/components/analytics/RealtimePanel";
import type { AnalyticsDashboardDTO } from "@/features/analytics/types";

const POLL_MS = 20_000;

export function RealtimePanelLive({
  initial,
  speaking,
}: {
  initial: AnalyticsDashboardDTO["realtime"];
  speaking: { initials: string; name: string }[];
}) {
  const [realtime, setRealtime] =
    React.useState<AnalyticsDashboardDTO["realtime"]>(initial);

  React.useEffect(() => {
    setRealtime(initial);
  }, [initial]);

  React.useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const res = await fetch("/api/analytics/realtime", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          realtime?: AnalyticsDashboardDTO["realtime"];
        };
        if (!cancelled && data.realtime) setRealtime(data.realtime);
      } catch {
        /* ignore */
      }
    };
    const id = window.setInterval(pull, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const throughputLoadPct = Math.min(
    100,
    Math.round(realtime.eventsPerSecond * 20),
  );

  return (
    <RealtimePanel
      realtime={realtime}
      speaking={speaking}
      throughputLoadPct={throughputLoadPct}
    />
  );
}
