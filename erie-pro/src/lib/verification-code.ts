// ── Verification Code Hashing ──────────────────────────────────────────
// Short numeric verification codes (e.g. the 6-digit claim-verification code
// emailed to a listing's business email) must NOT be stored in plaintext.
// A DB-read attacker (SQL injection, backup leak, admin DB access) could
// otherwise enumerate every outstanding code and verify claims they don't own.
//
// Plain SHA-256 at rest is also insufficient: a 6-digit code has only ~10^6
// possible values, so an attacker with the digest can brute-force the preimage
// on a laptop in milliseconds. We therefore HMAC with an app secret the
// attacker doesn't own — without the secret, enumeration is impossible even
// with full DB read.
//
// We also expose a constant-time `verifyVerificationCode` so callers don't
// have to reimplement timing-safe comparison (the previous call site used
// `Buffer.equals`, which is memcmp and short-circuits on the first mismatched
// byte — not constant-time).

import { createHmac, timingSafeEqual } from "crypto";

function getSecret(): string {
  // Prefer a dedicated secret for rotation; fall back to NEXTAUTH_SECRET
  // so we don't have to ship a separate env var to every deployment.
  const secret =
    process.env.VERIFICATION_CODE_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "VERIFICATION_CODE_SECRET or NEXTAUTH_SECRET must be set (min 16 chars) to hash verification codes"
    );
  }
  return secret;
}

/** HMAC-SHA256 a verification code for safe at-rest storage. */
export function hashVerificationCode(code: string): string {
  return createHmac("sha256", getSecret()).update(code).digest("hex");
}

/**
 * Constant-time compare a user-supplied raw code against a stored HMAC digest.
 * Returns false (not throw) on any malformed input so callers don't need a
 * try/catch for the common "wrong code" path.
 */
export function verifyVerificationCode(
  rawCode: string,
  storedHash: string
): boolean {
  if (typeof rawCode !== "string" || typeof storedHash !== "string") {
    return false;
  }
  let computed: string;
  try {
    computed = hashVerificationCode(rawCode);
  } catch {
    return false;
  }
  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
