import { PricingPage } from "@/components/pricing/PricingPage";
import {
  isPolarEnterpriseCheckoutConfigured,
  isPolarProCheckoutConfigured,
} from "@/lib/billing/polar-env";

export default function PremiumRoutePage() {
  const polarProCheckout = isPolarProCheckoutConfigured();
  const polarEnterpriseCheckout = isPolarEnterpriseCheckoutConfigured();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-5">
      <PricingPage
        polarProCheckout={polarProCheckout}
        polarEnterpriseCheckout={polarEnterpriseCheckout}
      />
    </div>
  );
}
