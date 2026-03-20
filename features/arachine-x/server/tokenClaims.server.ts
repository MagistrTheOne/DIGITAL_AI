export type AvatarTokenClaims = {
  token: string;
  websocketUrl: string;
  issuedAt: number;
  expiresAt: number;
};

export async function issueAvatarTokenClaims({
  sessionId,
}: {
  sessionId: string;
}): Promise<AvatarTokenClaims> {
  // Placeholder contract. Real implementation should sign/encode a short-lived token
  // and may vary by runtime (Edge for signing-only, Node for DB-backed session records).
  const now = Date.now();
  return {
    token: `arachne-dev-token:${sessionId}`,
    websocketUrl: "/api/arachine-x/ws",
    issuedAt: now,
    expiresAt: now + 60_000, // 60s
  };
}

