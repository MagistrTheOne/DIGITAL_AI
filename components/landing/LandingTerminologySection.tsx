import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TRUST_PRINCIPLES } from "@/lib/legal/trust-principles";

export function LandingTerminologySection() {
  return (
    <section
      id="terminology"
      className="scroll-mt-20 border-t border-white/10 bg-black px-4 py-20 sm:px-6 sm:py-28"
    >
      <div className="mx-auto w-full max-w-6xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
          Terminology & data posture
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
          Trust in plain language
        </h2>
        <p className="mt-5 max-w-3xl text-pretty text-base leading-relaxed text-neutral-400 sm:text-lg">
          Short definitions of how we talk about data and isolation on NULLXES.
          This is a summary for operators and procurement—not legal advice. If
          anything here conflicts with your order, DPA, or our{" "}
          <Link
            href="/terms"
            className="text-white underline decoration-white/35 underline-offset-4 hover:decoration-white"
          >
            Terms
          </Link>{" "}
          /{" "}
          <Link
            href="/privacy"
            className="text-white underline decoration-white/35 underline-offset-4 hover:decoration-white"
          >
            Privacy Policy
          </Link>
          , those documents control.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/trust"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-wider text-white transition hover:border-white/25 hover:bg-white/10"
          >
            Full trust center →
          </Link>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:gap-6">
          {TRUST_PRINCIPLES.map((item) => (
            <Card
              key={item.title}
              className="border-white/10 bg-neutral-950/75 text-neutral-100 shadow-none"
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

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-neutral-600">
          Enterprise and regulated teams: use pricing mailto paths or the
          contact form for DPA, subprocessors, and regional deployment questions.
        </p>
      </div>
    </section>
  );
}
