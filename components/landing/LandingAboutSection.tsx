import { LandingArchitectureCards } from "@/components/landing/LandingArchitectureCards";
import { LandingRoiCalculator } from "@/components/landing/LandingRoiCalculator";
import { LandingUseCaseCards } from "@/components/landing/LandingUseCaseCards";

export function LandingAboutSection() {
  return (
    <section id="about" className="scroll-mt-20 border-t border-white/10 bg-black">
      <div className="flex min-h-svh flex-col justify-center px-4 py-20 sm:px-6 sm:py-32">
        <div className="mx-auto w-full max-w-6xl">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
            Built for operators
          </h2>
          <div className="mt-6 max-w-3xl space-y-4 text-pretty text-base leading-relaxed text-neutral-400 sm:text-lg">
            <p>
              NULLXES is a control plane for AI employees: onboard them, run
              governed sessions, and scale usage with envelopes you can explain
              to security and finance — without rebuilding your stack every
              quarter.
            </p>
            <p>
              You set policies, access, and throughput boundaries; the platform
              keeps sessions, billing signals, and employee surfaces aligned so
              product and ops can ship iterations without a new integration for
              every modality change. The goal is observable usage, predictable
              limits, and a straight path from pilot to production.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-neutral-400 marker:text-neutral-600">
              <li>
                One place to manage AI employees, session patterns, and
                consumption — instead of ad hoc scripts and spreadsheets.
              </li>
              <li>
                Auth, billing, and orchestration stay server-side so rules stay
                enforceable as you add teams and regions.
              </li>
              <li>
                Video and avatar surfaces stay swap-friendly when realtime
                engines mature, so you are not locked into a single render path.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex min-h-svh flex-col justify-center border-t border-white/10 px-4 py-20 sm:px-6 sm:py-32">
        <div className="mx-auto w-full max-w-6xl">
          <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
            Architecture
          </h3>
          <LandingArchitectureCards />
        </div>
      </div>

      <div className="flex min-h-svh flex-col justify-center border-t border-white/10 px-6 py-24 sm:py-32">
        <div className="mx-auto w-full max-w-6xl">
          <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
            Use cases
          </h3>
          <p className="mt-4 max-w-2xl text-neutral-400">
            Pick a lane — the same session model powers front-office and
            internal workflows. Select a card to read the full conditions.
          </p>
          <div className="mt-10 border-t border-white/10 pt-10">
            <LandingUseCaseCards />
          </div>
        </div>
      </div>

      <div className="flex min-h-svh flex-col justify-center border-t border-white/10 px-4 py-20 sm:px-6 sm:py-32">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center">
          <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
            Effect & economics
          </h3>
          <p className="mt-4 max-w-2xl text-pretty text-center text-sm text-neutral-400 sm:text-base">
            Time back vs. a loaded rate — pair with your integration or renewal
            budget to sanity-check build-vs-buy.
          </p>
          <div className="mt-12 w-full max-w-2xl">
            <LandingRoiCalculator />
          </div>
        </div>
      </div>
    </section>
  );
}
