import { AppHeader } from "@/components/app/AppHeader";

import { PricingGrid } from "@/components/pricing/PricingGrid";

export function PricingPage() {
  return (
    <div className="flex flex-col gap-8">
      <AppHeader
        title="Pricing"
        subtitle="Scale your AI workforce — from startup to enterprise-grade infrastructure."
      />
      <PricingGrid />
    </div>
  );
}
