// ── Intake conversation session token ────────────────────────────────
//
// Audit C4: anonymous intake conversations are looked up by client-controlled
// UUID. Without a server-issued secret bound to the conversation, anyone who
// learns a conversationId can advance the conversation and write the contact
// step under their own phone/email. This module mints + verifies an opaque
// session token that we store on the IntakeConversation row and on a
// HTTP-only cookie. Every step beyond /api/intake/start must present a
// cookie value that matches the row.
//
// Compatibility: legacy rows created before this column existed have
// sessionToken = null. For those we fall through (no enforcement), so the
// migration is non-breaking. New rows always have a token and always
// require the cookie to match.

import { randomBytes } from "crypto";

export const INTAKE_SESSION_COOKIE = "intake_sid" as const;
/** 30 days — covers any reasonable abandon-then-resume window. */
export const INTAKE_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

/** 32 bytes of crypto-random, base64url-encoded. ~43 chars. */
export function mintSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Verify that a presented cookie value matches the stored token on the row.
 *
 *   - If the row has no token (legacy / pre-migration row), permit.
 *   - If the row has a token and the cookie is missing or mismatches, reject.
 *
 * Returns true on permit, false on reject. Throws on neither.
 */
export function verifySessionToken(
  stored: string | null | undefined,
  presented: string | null | undefined
): boolean {
  if (!stored) return true; // legacy row — no enforcement
  if (!presented) return false;
  // Constant-time compare via length-equal + bitwise XOR accumulator.
  if (stored.length !== presented.length) return false;
  let diff = 0;
  for (let i = 0; i < stored.length; i++) {
    diff |= stored.charCodeAt(i) ^ presented.charCodeAt(i);
  }
  return diff === 0;
}
