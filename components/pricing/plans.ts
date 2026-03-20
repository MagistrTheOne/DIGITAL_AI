import type { PricingPlan } from "@/components/pricing/types";

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    priceLabel: "$0",
    features: [
      "Limited sessions",
      "Limited tokens",
      "Basic AI employees",
    ],
    ctaLabel: "Start free",
    ctaVariant: "outline",
    href: "/sign-up",
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Recommended",
    priceLabel: "$66 / mo",
    features: [
      "Higher limits",
      "Real-time sessions",
      "Voice enabled",
      "Priority performance",
    ],
    ctaLabel: "Upgrade to Pro",
    ctaVariant: "default",
    href: "/settings",
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceLabel: "Custom",
    features: [
      "Unlimited usage",
      "Dedicated infrastructure",
      "SLA support",
      "Custom integrations",
    ],
    ctaLabel: "Contact sales",
    ctaVariant: "outline",
    href: "mailto:sales@nullxes.com?subject=Enterprise%20plan",
  },
  {
    id: "govtech",
    name: "GovTech",
    priceLabel: "Custom",
    features: [
      "Government-grade deployment",
      "On-prem / secure infra",
      "Compliance ready",
      "Dedicated support",
    ],
    ctaLabel: "Request access",
    ctaVariant: "outline",
    href: "mailto:sales@nullxes.com?subject=GovTech%20plan",
  },
];
