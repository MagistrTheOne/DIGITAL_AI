"use client";

import { LandingPricingVerticalCards } from "@/components/landing/LandingPricingVerticalCards";

export function LandingPricingSection() {
  return (
    <section
      id="pricing"
      className="scroll-mt-20 border-t border-white/10 bg-black px-4 py-20 sm:px-6 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
              Pricing
            </h2>
            <p className="mt-4 max-w-2xl text-pretty text-lg text-neutral-400">
              Choose a lane. Upgrade when sessions and throughput need room to
              grow. Select a card to focus the lane; CTAs stay one click away.
            </p>
          </div>
        </div>

        <div className="mt-12 lg:mt-16">
          <LandingPricingVerticalCards />
        </div>
      </div>
    </section>
  );
}
