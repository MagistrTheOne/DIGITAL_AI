import type { Metadata } from "next";
import Link from "next/link";

import { LegalDocChrome } from "@/components/legal/LegalDocChrome";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TRUST_PRINCIPLES } from "@/lib/legal/trust-principles";

export const metadata: Metadata = {
  title: "Trust Center — NULLXES",
  description:
    "How NULLXES describes data posture, isolation, and operational trust.",
};

export default function TrustPage() {
  return (
    <LegalDocChrome active="trust">
      <header className="border-b border-white/10 pb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
          Trust center
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Trust in plain language
        </h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: April 6, 2026</p>
        <p className="mt-6 text-sm leading-relaxed text-neutral-400 sm:text-base">
          This page summarizes how we talk about data, isolation, and operations
          on NULLXES. It is designed for operators, security reviewers, and
          procurement—not as a substitute for legal advice. If anything here
          conflicts with your order, DPA, or our{" "}
          <Link
            href="/terms"
            className="text-white underline decoration-white/35 underline-offset-4 hover:decoration-white"
          >
            Terms of Service
          </Link>{" "}
          or{" "}
          <Link
            href="/privacy"
            className="text-white underline decoration-white/35 underline-offset-4 hover:decoration-white"
          >
            Privacy Policy
          </Link>
          , those documents control.
        </p>
      </header>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {TRUST_PRINCIPLES.map((item) => (
          <Card
            key={item.title}
            className="border-white/10 bg-black/30 text-neutral-100 shadow-none"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-neutral-400">
                {item.body}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-white/10 bg-white/3 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-white">Next steps</h2>
        <ul className="mt-4 space-y-3 text-sm text-neutral-400">
          <li>
            <Link
              href="/privacy"
              className="text-white underline decoration-white/35 underline-offset-4 hover:decoration-white"
            >
              Read the full Privacy Policy
            </Link>{" "}
            for categories of data, retention, rights, and transfers.
          </li>
          <li>
            <Link
              href="/terms"
              className="text-white underline decoration-white/35 underline-offset-4 hover:decoration-white"
            >
              Read the Terms of Service
            </Link>{" "}
            for acceptable use, liability, and termination.
          </li>
          <li>
            <Link
              href="/home#contact"
              className="text-white underline decoration-white/35 underline-offset-4 hover:decoration-white"
            >
              Contact us
            </Link>{" "}
            for DPA, subprocessors, security questionnaires, or GovTech paths.
          </li>
        </ul>
      </div>
    </LegalDocChrome>
  );
}
