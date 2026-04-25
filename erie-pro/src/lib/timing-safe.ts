// ── Timing-safe string comparison ────────────────────────────────────
// `===` on secrets (Bearer tokens, HMAC tokens, webhook signatures)
// short-circuits on the first mismatched byte, which leaks the secret
// one byte at a time under a well-instrumented timing oracle. Even if
// modern CDNs and V8 make that hard to exploit in practice, using
// constant-time equality is cheap and closes the theoretical channel.
//
// Both operands are hashed with SHA-256 before comparison. That
// sidesteps `timingSafeEqual`'s "buffers must be equal length"
// precondition — different-length inputs cannot leak length info via
// the equality check itself.

import { createHash, timingSafeEqual } from "crypto";

export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
