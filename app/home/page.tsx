import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "NULLXES — AI digital workforce",
  description:
    "Deploy digital employees with voice, avatar, and production-ready workflows. NULLXES is the control plane for your AI workforce.",
};

/** Marketing landing; always shown (no redirect when signed in). */
export default function HomeMarketingPage() {
  return <LandingPage />;
}
