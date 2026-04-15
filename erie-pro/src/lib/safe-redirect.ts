// ── Same-origin redirect validator ──────────────────────────────────
// Any time we accept a post-login/post-action redirect target from the
// query string, we MUST validate that the target is a same-origin
// relative path. Otherwise an attacker can hand a victim a link like
// `/login?callbackUrl=https://evil.example.com/phish`, and after a
// successful login the browser follows the redirect to the attacker's
// site while the user still trusts the URL bar because they "just
// logged in." That's the classic open-redirect → phishing chain.
//
// Allowed:
//   /dashboard
//   /dashboard/leads?filter=open
//
// Rejected (all map to the fallback):
//   https://evil.com         — absolute URL with scheme
//   //evil.com/foo           — protocol-relative URL (browsers treat
//                              these as absolute with the current scheme)
//   \\evil.com               — Windows UNC / IE-era same-origin bypass
//   javascript:alert(1)      — scheme-only URI, no leading slash but
//                              still navigable
//   ../foo                   — goes up from wherever the base is; we
//                              only accept rooted paths
//   (null / empty / non-string) — nothing to validate, use fallback

const DEFAULT_FALLBACK = "/dashboard";

export function safeCallbackUrl(
  raw: string | null | undefined,
  fallback: string = DEFAULT_FALLBACK,
): string {
  if (typeof raw !== "string" || raw.length === 0) return fallback;

  // Must start with a single forward slash and NOT a second slash or
  // backslash. `//evil.com` and `/\evil.com` are both protocol-relative
  // in various browser quirks.
  if (raw[0] !== "/") return fallback;
  if (raw.length >= 2 && (raw[1] === "/" || raw[1] === "\\")) return fallback;

  // Defense-in-depth: even if the string starts with `/`, a URL parser
  // should resolve it against a dummy origin and the resulting host
  // must equal the dummy origin's host. This catches weirdness like
  // `/\\evil.com` that some browsers normalize off-origin.
  try {
    const url = new URL(raw, "http://safe-redirect.local");
    if (url.host !== "safe-redirect.local") return fallback;
  } catch {
    return fallback;
  }

  return raw;
}
