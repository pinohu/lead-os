// ── URL Safety Helpers ──────────────────────────────────────────────
// Best-effort SSRF guard for URLs we're asked to fetch on behalf of
// authenticated users (webhook endpoints, OAuth callbacks, etc).
//
// This is LITERAL-STRING validation only. It does not resolve DNS, so a
// hostname that publicly resolves to a private IP (DNS rebinding, split
// horizon DNS) will still pass — the real defense there is to run these
// fetches from a sandboxed egress proxy. On our platform (Vercel
// serverless) the practical blast radius of SSRF is small (no AWS IMDS,
// no in-VPC services to pivot to) but we still reject the obvious
// footguns so a malicious provider can't:
//   1. Point a webhook at 127.0.0.1 / 169.254.169.254 to probe our own
//      lambda's network surface.
//   2. Use schemes other than http(s) (file://, gopher://, etc).
//   3. Embed credentials in the URL (user:pass@host) which would be
//      logged in error paths.

const PRIVATE_HOSTNAMES = new Set([
  "localhost",
  "ip6-localhost",
  "ip6-loopback",
  "metadata.google.internal",
  "metadata.goog",
]);

const PRIVATE_SUFFIXES = [
  ".local",
  ".localhost",
  ".internal",
  ".intranet",
  ".corp",
  ".home",
  ".lan",
  ".cluster.local",
];

/** Parse octets from an IPv4 literal. Returns null if not a valid literal. */
function parseIPv4(host: string): [number, number, number, number] | null {
  const parts = host.split(".");
  if (parts.length !== 4) return null;
  const octets: number[] = [];
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n < 0 || n > 255) return null;
    octets.push(n);
  }
  return octets as [number, number, number, number];
}

/** True when `host` is an IPv4 literal inside a private / reserved range. */
function isPrivateIPv4(host: string): boolean {
  const o = parseIPv4(host);
  if (!o) return false;
  const [a, b] = o;
  // 0.0.0.0/8 (this network)
  if (a === 0) return true;
  // 10.0.0.0/8 (private)
  if (a === 10) return true;
  // 127.0.0.0/8 (loopback)
  if (a === 127) return true;
  // 169.254.0.0/16 (link-local, AWS IMDS lives here)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 (private)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 (private)
  if (a === 192 && b === 168) return true;
  // 198.18.0.0/15 (benchmark)
  if (a === 198 && (b === 18 || b === 19)) return true;
  // 224.0.0.0/4 (multicast) and 240.0.0.0/4 (reserved)
  if (a >= 224) return true;
  return false;
}

/** True when `host` is an IPv6 literal inside a private / reserved range. */
function isPrivateIPv6(host: string): boolean {
  // URL hostnames strip the brackets, so we receive the literal directly.
  const lower = host.toLowerCase();
  if (!lower.includes(":")) return false;
  if (lower === "::" || lower === "::1") return true;
  // fc00::/7 — unique local addresses
  if (/^fc[0-9a-f]{2}:/i.test(lower) || /^fd[0-9a-f]{2}:/i.test(lower))
    return true;
  // fe80::/10 — link-local
  if (/^fe[89ab][0-9a-f]:/i.test(lower)) return true;
  // IPv4-mapped IPv6 in dotted form: ::ffff:a.b.c.d (WHATWG URL rarely
  // leaves this form, but still possible if the value came from elsewhere).
  const v4mappedDotted = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4mappedDotted) return isPrivateIPv4(v4mappedDotted[1]);
  // IPv4-mapped IPv6 in colon-hex form: ::ffff:h1:h2 (WHATWG's normalized
  // form, e.g. ::ffff:127.0.0.1 → ::ffff:7f00:1). Parse the two groups as
  // 16-bit hex, reassemble to an IPv4 dotted literal, then re-check.
  const v4mappedHex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (v4mappedHex) {
    const hi = parseInt(v4mappedHex[1], 16);
    const lo = parseInt(v4mappedHex[2], 16);
    if (
      !Number.isNaN(hi) &&
      !Number.isNaN(lo) &&
      hi >= 0 &&
      hi <= 0xffff &&
      lo >= 0 &&
      lo <= 0xffff
    ) {
      const dotted = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${
        lo & 0xff
      }`;
      return isPrivateIPv4(dotted);
    }
  }
  return false;
}

export type UrlSafetyResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Validate that a URL is safe to fetch on behalf of an authenticated user.
 * HTTPS-only by default (set `allowHttp` if you have a reason to allow http —
 * you probably don't).
 */
export function checkFetchableUrl(
  raw: string,
  opts: { allowHttp?: boolean } = {}
): UrlSafetyResult {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, reason: "Must be a valid absolute URL" };
  }

  if (opts.allowHttp) {
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false, reason: "URL must use http:// or https://" };
    }
  } else if (parsed.protocol !== "https:") {
    return { ok: false, reason: "URL must use https://" };
  }

  if (parsed.username || parsed.password) {
    return {
      ok: false,
      reason: "URL must not contain credentials (user:pass@host)",
    };
  }

  // Reject common private hostnames / IP literals. Note: we deliberately
  // do NOT attempt DNS resolution here — that's expensive, can be racy
  // (DNS rebinding), and would add a round-trip to every validation.
  const hostnameRaw = parsed.hostname.toLowerCase();
  // WHATWG URL leaves IPv6 literals bracketed ("[::1]"); strip for matching.
  const hostname =
    hostnameRaw.startsWith("[") && hostnameRaw.endsWith("]")
      ? hostnameRaw.slice(1, -1)
      : hostnameRaw;

  if (PRIVATE_HOSTNAMES.has(hostname)) {
    return { ok: false, reason: "Host is not allowed" };
  }
  for (const suffix of PRIVATE_SUFFIXES) {
    if (hostname.endsWith(suffix)) {
      return { ok: false, reason: "Host is not allowed" };
    }
  }

  if (isPrivateIPv4(hostname) || isPrivateIPv6(hostname)) {
    return { ok: false, reason: "Host is not allowed" };
  }

  return { ok: true };
}
