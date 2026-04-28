import { createHmac, timingSafeEqual } from "crypto";

export type SelfServiceTokenPurpose = "unsubscribe" | "preferences" | "gdpr";

export function getSelfServiceTokenSecret(): string | null {
  const secret = process.env.LEAD_OS_AUTH_SECRET?.trim();
  return secret ? secret : null;
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function timingSafeEqualString(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function createSelfServiceToken(
  purpose: SelfServiceTokenPurpose,
  email: string,
  tenantId: string,
  length = 32,
): string | null {
  const secret = getSelfServiceTokenSecret();
  if (!secret) return null;

  return createHmac("sha256", secret)
    .update(`${purpose}::${normalizeEmail(email)}::${tenantId.trim()}`)
    .digest("hex")
    .slice(0, length);
}

export function verifySelfServiceToken(
  purpose: SelfServiceTokenPurpose,
  email: string,
  tenantId: string,
  token: string,
  length = 32,
): boolean {
  const expected = createSelfServiceToken(purpose, email, tenantId, length);
  if (!expected) return false;
  return timingSafeEqualString(token, expected);
}
