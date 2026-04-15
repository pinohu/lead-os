// ── Unsubscribe HMAC tokens ─────────────────────────────────────────
// The List-Unsubscribe header (CAN-SPAM / RFC 8058) is GET-based, so
// we can't require a session to validate the request. Instead each
// unsubscribe link carries an HMAC-like token bound to the recipient
// email; without the token, an attacker who guesses any email address
// could mass-unsubscribe arbitrary users and grief our send reputation.
//
// Critical invariants:
//   1. Token generation (src/lib/email.ts) and verification
//      (src/app/api/unsubscribe/route.ts) MUST use the SAME secret.
//      Drift silently invalidates every outgoing link. Centralize.
//   2. NEVER fall back to a hardcoded/publicly-knowable default. If
//      that happens, anyone can forge tokens. Fail closed instead.
//   3. NEXTAUTH_SECRET is already required to run NextAuth v5, so we
//      can rely on it being present in every environment that also
//      sends email. UNSUBSCRIBE_SECRET is an optional override for
//      operators who want to rotate unsubscribe tokens independently
//      of session cookies.

import { createHash } from "crypto";

function getSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 16) {
    // Fail closed: no silent fallback to a public string. A missing
    // secret in production is a deployment bug that must be fixed, not
    // papered over by accepting forgeable tokens.
    throw new Error(
      "UNSUBSCRIBE_SECRET or NEXTAUTH_SECRET must be set (min 16 chars) to generate/verify unsubscribe tokens",
    );
  }
  return secret;
}

/** Generate a per-email unsubscribe token. Stable across sends. */
export function generateUnsubscribeToken(email: string): string {
  const normalized = email.toLowerCase().trim();
  const secret = getSecret();
  return createHash("sha256")
    .update(`${normalized}:${secret}`)
    .digest("hex")
    .slice(0, 32);
}
