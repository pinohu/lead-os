// ── Trusted Client-IP Extraction ─────────────────────────────────────
// The old helper read the LEFTMOST entry of `x-forwarded-for`, which
// is CLIENT-CONTROLLED on every CDN/proxy that appends rather than
// replaces. An attacker hitting the Vercel edge can send
// `X-Forwarded-For: <random-spoof>` over the socket; Vercel appends
// the real socket IP on the right, yielding
//   x-forwarded-for: <spoof>, <real-client-ip>
// Reading the left entry therefore let any caller impersonate a fresh
// IP per request and sail through every rate limit (claim, contact,
// lead submission, checkout, API-key creation, etc.) while also
// poisoning audit `ipAddress` fields with whatever they wanted logged.
//
// The safe order of trust on Vercel/Cloudflare/AWS ALB-style edges:
//   1. `x-real-ip`              — platform-set to the actual socket peer.
//   2. `x-vercel-forwarded-for` — Vercel-specific, also platform-set.
//   3. RIGHTMOST `x-forwarded-for` — the last hop (our trusted edge) added this.
//   4. "unknown"                — never let a missing header pick "".
//
// All four of those are still only as trustworthy as our deployment
// topology: if someone deploys this app behind a proxy that DOESN'T
// strip client-provided `x-real-ip`, the trust story changes. Comment
// guards that assumption so the next operator notices.
import type { NextRequest } from "next/server";

export function getClientIp(req: NextRequest | Request): string {
  const headers = req.headers;
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const vercelXff = headers.get("x-vercel-forwarded-for")?.trim();
  if (vercelXff) {
    // Same rightmost rule applies if Vercel ever chains.
    const parts = vercelXff.split(",").map((p) => p.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last;
  }

  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last;
  }

  return "unknown";
}
