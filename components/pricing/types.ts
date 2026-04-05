export type PricingPlanId = "free" | "pro" | "enterprise" | "govtech";

export type PricingPlan = {
  id: PricingPlanId;
  name: string;
  /** One line under the plan name (audience / positioning). */
  tagline?: string;
  badge?: string;
  priceLabel: string;
  /** Small line under the price (billing context). */
  priceHint?: string;
  /** Shown when billing toggle is Yearly (e.g. Pro). */
  yearlyPriceLabel?: string;
  yearlyPriceHint?: string;
  features: string[];
  ctaLabel: string;
  /** One line under the CTA (e.g. billing trust copy on Pro). */
  ctaSubtext?: string;
  ctaVariant: "default" | "outline";
  href: string;
  highlighted?: boolean;
};
