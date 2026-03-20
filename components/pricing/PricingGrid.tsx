import { PRICING_PLANS } from "@/components/pricing/plans";
import { PricingCard } from "@/components/pricing/PricingCard";

export function PricingGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {PRICING_PLANS.map((plan) => (
        <PricingCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}
