import Link from "next/link";

import { LandingHeroNeuronLayer } from "@/components/landing/LandingHeroNeuronLayer";
import { LandingVideoCard } from "@/components/landing/LandingVideoCard";

export function LandingHero({ authenticated = false }: { authenticated?: boolean }) {
  return (
    <section className="relative flex min-h-svh flex-col justify-center overflow-hidden bg-black px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
      <LandingHeroNeuronLayer />
      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-stretch gap-10 sm:gap-14 lg:grid-cols-[1fr_minmax(240px,32%)] lg:gap-16">
        <div className="flex flex-col justify-center text-center lg:text-left">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-500 sm:mb-4 sm:text-xs sm:tracking-[0.25em]">
            NULLXES · AI digital workforce
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
            Deploy digital employees for real work
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-neutral-400 sm:mt-6 sm:text-lg md:text-xl lg:mx-0">
            Session-based AI employees with voice, avatar, and workflows
            engineered for production rollouts and governed operations.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm sm:mt-12 sm:gap-x-10 sm:gap-y-4 lg:justify-start">
            {authenticated ? (
              <Link
                href="/ai-digital"
                className="text-white underline decoration-white/40 underline-offset-[6px] transition hover:decoration-white"
              >
                Open dashboard
              </Link>
            ) : (
              <Link
                href="/sign-up"
                className="text-white underline decoration-white/40 underline-offset-[6px] transition hover:decoration-white"
              >
                Enter the system
              </Link>
            )}
            <a
              href="#about"
              className="text-neutral-500 transition hover:text-neutral-300"
            >
              Learn more
            </a>
          </div>
        </div>
        <div className="flex min-h-[min(360px,52dvh)] justify-center sm:min-h-[min(400px,55dvh)] lg:min-h-[min(88dvh,900px)] lg:max-h-[900px] lg:justify-end">
          <LandingVideoCard
            variant="hero"
            className="h-full w-full max-w-[min(100%,280px)] sm:max-w-[300px] lg:max-w-none"
          />
        </div>
      </div>
    </section>
  );
}
