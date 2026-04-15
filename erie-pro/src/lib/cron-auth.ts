// ── Cron endpoint authentication ────────────────────────────────────
// Every /api/cron/* handler is called by Vercel Cron (or a manual
// operator) with an `Authorization: Bearer <CRON_SECRET>` header.
//
// The naive `authHeader === "Bearer " + secret` check leaks the secret
// byte-by-byte via response-time side channels. `crypto.timingSafeEqual`
// compares in constant time; wrapping it in a single helper also keeps
// the "CRON_SECRET is unset" guard consistent across all callers so
// we never accept `Bearer undefined`.

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/timing-safe";

/**
 * Returns `null` if the request carries a valid cron Bearer token, or
 * a 401 NextResponse otherwise. Intended to be used at the top of
 * every /api/cron/* handler:
 *
 *     const unauthorized = requireCronAuth(req);
 *     if (unauthorized) return unauthorized;
 */
export function requireCronAuth(req: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  // Defense-in-depth: if CRON_SECRET is unset, reject ALL requests.
  // Otherwise `Bearer undefined` would silently match a literal
  // `undefined` string concatenation bug.
  if (!cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expected = `Bearer ${cronSecret}`;
  if (!safeEqual(authHeader, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

/**
 * Like `requireCronAuth` but returns a boolean — suitable for callers
 * that want to conditionally *expand* the response (e.g. /api/health
 * returns more detail when authenticated instead of 401'ing).
 */
export function isCronAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;
  return safeEqual(authHeader, `Bearer ${cronSecret}`);
}
