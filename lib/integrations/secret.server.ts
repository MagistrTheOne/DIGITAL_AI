import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const VERSION = 1;

function integrationKey(): Buffer {
  const raw = process.env.INTEGRATIONS_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error("INTEGRATIONS_ENCRYPTION_KEY is not set");
  }
  return createHash("sha256").update(raw, "utf8").digest();
}

export function isIntegrationsEncryptionConfigured(): boolean {
  return Boolean(process.env.INTEGRATIONS_ENCRYPTION_KEY?.trim());
}

export function encryptIntegrationSecret(plain: string): string {
  const key = integrationKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from([VERSION]), iv, tag, enc]).toString(
    "base64url",
  );
}

export function decryptIntegrationSecret(payload: string): string {
  const key = integrationKey();
  const buf = Buffer.from(payload, "base64url");
  if (buf.length < 1 + 12 + 16 + 1 || buf[0] !== VERSION) {
    throw new Error("invalid_integration_secret_payload");
  }
  const iv = buf.subarray(1, 13);
  const tag = buf.subarray(13, 29);
  const data = buf.subarray(29);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}
