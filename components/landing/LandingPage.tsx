import { getCurrentSession } from "@/lib/auth/session.server";
import { NeuralFieldBackground } from "@/components/landing/NeuralFieldBackground";
import { LandingAboutSection } from "@/components/landing/LandingAboutSection";
import { LandingContactSection } from "@/components/landing/LandingContactSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingPricingSection } from "@/components/landing/LandingPricingSection";
import { LandingTerminologySection } from "@/components/landing/LandingTerminologySection";

export async function LandingPage() {
  const session = await getCurrentSession();
  const authenticated = Boolean(session?.user);

  return (
    <>
      <NeuralFieldBackground />
      <div className="relative z-10 bg-transparent">
        <LandingNav authenticated={authenticated} />
        <main>
          <LandingHero authenticated={authenticated} />
          <LandingAboutSection />
          <LandingPricingSection />
          <LandingTerminologySection />
          <LandingContactSection />
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
