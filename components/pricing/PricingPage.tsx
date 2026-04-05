import { AppHeader } from "@/components/app/AppHeader";

import { PricingGrid } from "@/components/pricing/PricingGrid";

export function PricingPage({
  polarProCheckout = false,
  polarEnterpriseCheckout = false,
}: {
  polarProCheckout?: boolean;
  polarEnterpriseCheckout?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <AppHeader
        compact
        title="Pricing"
        subtitle="Pick a plan that matches sessions, voice, and support — upgrade anytime."
      />
      <PricingGrid
        polarProCheckout={polarProCheckout}
        polarEnterpriseCheckout={polarEnterpriseCheckout}
      />
    </div>
  );
}
