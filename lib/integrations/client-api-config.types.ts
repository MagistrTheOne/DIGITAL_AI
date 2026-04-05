export type ClientApiIntegrationConfig = {
  baseUrl: string;
  /** Optional prefix every request path must start with (e.g. /v1). */
  pathPrefix?: string;
  /** Uppercase methods; default GET, POST, PATCH, PUT. */
  allowedMethods?: string[];
  /** Header name for the API key (default Authorization). */
  authHeaderName?: string;
  /** bearer = "Bearer <key>"; raw = key only. */
  authScheme?: "bearer" | "raw";
};

export function defaultClientApiConfig(
  partial: Partial<ClientApiIntegrationConfig> & { baseUrl: string },
): ClientApiIntegrationConfig {
  return {
    baseUrl: partial.baseUrl,
    pathPrefix:
      typeof partial.pathPrefix === "string" ? partial.pathPrefix : undefined,
    allowedMethods: Array.isArray(partial.allowedMethods)
      ? partial.allowedMethods
      : ["GET", "POST", "PATCH", "PUT"],
    authHeaderName:
      typeof partial.authHeaderName === "string" && partial.authHeaderName.trim()
        ? partial.authHeaderName.trim()
        : "Authorization",
    authScheme: partial.authScheme === "raw" ? "raw" : "bearer",
  };
}
