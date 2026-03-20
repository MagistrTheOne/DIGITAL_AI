/**
 * Account strip DTO for dashboard UI (BFF → client).
 * No DB or Better Auth internal types.
 */
export type AccountDashboardDTO = {
  name: string;
  email: string;
  image?: string | null;
  plan: string;
  usage: {
    sessions: string;
    tokens: string;
  };
};
