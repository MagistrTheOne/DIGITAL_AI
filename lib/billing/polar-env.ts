import type { PlanType } from "@/features/account/types";

export type PolarServerMode = "sandbox" | "production";

export function getPolarServer(): PolarServerMode {
  const raw = process.env.POLAR_SERVER?.trim().toLowerCase();
  return raw === "production" ? "production" : "sandbox";
}

export function getPolarAccessToken(): string | undefined {
  const t = process.env.POLAR_ACCESS_TOKEN?.trim();
  return t || undefined;
}

export function getPolarWebhookSecret(): string | undefined {
  const s = process.env.POLAR_WEBHOOK_SECRET?.trim();
  return s || undefined;
}

function getPolarProductProSingle(): string | undefined {
  return process.env.POLAR_PRODUCT_PRO?.trim() || undefined;
}

/** Pro checkout: token + monthly/yearly and/or single `POLAR_PRODUCT_PRO`. */
export function isPolarProCheckoutConfigured(): boolean {
  const token = getPolarAccessToken();
  if (!token) return false;
  const monthly = process.env.POLAR_PRODUCT_PRO_MONTHLY?.trim();
  const yearly = process.env.POLAR_PRODUCT_PRO_YEARLY?.trim();
  const single = getPolarProductProSingle();
  return Boolean(monthly || yearly || single);
}

/** Enterprise checkout: token + `POLAR_PRODUCT_ENTERPRISE`. */
export function isPolarEnterpriseCheckoutConfigured(): boolean {
  return Boolean(
    getPolarAccessToken() && process.env.POLAR_PRODUCT_ENTERPRISE?.trim(),
  );
}

export function isPolarPortalConfigured(): boolean {
  return Boolean(getPolarAccessToken());
}

export function getProPolarProductId(
  period: "monthly" | "yearly",
): string | undefined {
  const single = getPolarProductProSingle();
  if (period === "yearly") {
    const y = process.env.POLAR_PRODUCT_PRO_YEARLY?.trim();
    if (y) return y;
    if (single) return single;
    return process.env.POLAR_PRODUCT_PRO_MONTHLY?.trim() || undefined;
  }
  const m = process.env.POLAR_PRODUCT_PRO_MONTHLY?.trim();
  if (m) return m;
  if (single) return single;
  return process.env.POLAR_PRODUCT_PRO_YEARLY?.trim() || undefined;
}

export function getEnterprisePolarProductId(): string | undefined {
  return process.env.POLAR_PRODUCT_ENTERPRISE?.trim() || undefined;
}

export function planTypeForPolarProductId(productId: string): PlanType | null {
  const monthly = process.env.POLAR_PRODUCT_PRO_MONTHLY?.trim();
  const yearly = process.env.POLAR_PRODUCT_PRO_YEARLY?.trim();
  const singlePro = getPolarProductProSingle();
  if (
    productId === monthly ||
    productId === yearly ||
    (singlePro && productId === singlePro)
  ) {
    return "PRO";
  }
  const enterprise = process.env.POLAR_PRODUCT_ENTERPRISE?.trim();
  if (enterprise && productId === enterprise) return "ENTERPRISE";
  return null;
}

export function getAppOrigin(): string {
  const u =
    process.env.BETTER_AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim();
  if (!u) {
    throw new Error("BETTER_AUTH_URL or NEXT_PUBLIC_BETTER_AUTH_URL is required");
  }
  return u.replace(/\/$/, "");
}
