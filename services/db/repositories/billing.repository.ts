/**
 * Billing / subscription — stub until Polar or DB-backed plans exist.
 */
export type BillingSnapshot = {
  planName: string;
};

export async function getPlanForUser(_userId: string): Promise<BillingSnapshot> {
  return {
    planName: "Free",
  };
}
