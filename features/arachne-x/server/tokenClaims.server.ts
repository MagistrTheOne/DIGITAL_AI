/**
 * Shape returned to the browser / BFF clients (matches ARACHNE mint response).
 */
export type AvatarTokenClaims = {
  token: string;
  websocketUrl: string;
  issuedAt: string;
  expiresAt: string;
};
