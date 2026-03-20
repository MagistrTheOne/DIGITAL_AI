export type PricingPlanId = "free" | "pro" | "enterprise" | "govtech";

export type PricingPlan = {
  id: PricingPlanId;
  name: string;
  badge?: string;
  priceLabel: string;
  features: string[];
  ctaLabel: string;
  ctaVariant: "default" | "outline";
  href: string;
  highlighted?: boolean;
};
