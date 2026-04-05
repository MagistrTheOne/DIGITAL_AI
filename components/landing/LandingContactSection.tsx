import { LandingContactPanel } from "@/components/landing/LandingContactPanel";

export function LandingContactSection() {
  return (
    <section
      id="contact"
      className="scroll-mt-20 border-t border-white/10 bg-gradient-to-b from-black via-neutral-950/35 to-black"
    >
      <div className="mx-auto flex min-h-dvh w-full flex-col justify-center px-4 py-14 sm:px-6 sm:py-20">
        <LandingContactPanel />
      </div>
    </section>
  );
}
