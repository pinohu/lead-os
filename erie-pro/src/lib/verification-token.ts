// ── Verification token hashing ──────────────────────────────────────
// Tokens emailed to users (password reset, email verification, etc.)
// should be unusable if the database is later compromised. Store only
// the SHA-256 hash at rest; require the raw token on every verify
// request and hash-and-compare.
//
// This is the exact same construction password reset uses; centralizing
// it prevents drift (e.g. one flow using SHA-256 and another using raw,
// which is how we landed in the "email verify was broken AND leaking
// raw tokens in the DB" situation before this was extracted).

import { createHash } from "crypto";

/** Hash a token the same way for storage and lookup. */
export function hashVerificationToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
