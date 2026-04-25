import { NextRequest, NextResponse } from "next/server"
import { niches } from "@/lib/niches"
import { cityConfig } from "@/lib/city-config"

const VALID_NICHES = new Set(niches.map((n) => n.slug))

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get("host") ?? ""
  const url = request.nextUrl.clone()

  // ── www → non-www redirect ─────────────────────────────────────
  // Canonical-host allowlist: the previous version constructed the
  // 301 target from whatever `Host:` said, which is a full open-
  // redirect primitive if this service is ever deployed behind a
  // proxy that doesn't filter arbitrary host headers. An attacker
  // sending `Host: www.evil.com` would receive a 301 to
  // `https://evil.com/...`, turning our domain into a trust-washing
  // link for phishing/SEO-poisoning. Vercel's edge host-routing
  // currently blocks this in prod, but we shouldn't rely on an
  // external gate for correctness — require the stripped host to
  // live under our configured canonical domain before redirecting.
  if (hostname.startsWith("www.")) {
    const newHost = hostname.slice(4) // drop "www."
    // Strip port (":3000") for comparison; redirect URL is HTTPS so
    // port doesn't survive anyway.
    const bareHost = newHost.split(":")[0].toLowerCase()
    const canonical = cityConfig.domain.toLowerCase()
    const allowed =
      bareHost === canonical || bareHost.endsWith(`.${canonical}`)
    if (allowed) {
      return NextResponse.redirect(
        new URL(`https://${bareHost}${pathname}${url.search}`),
        301
      )
    }
    // Untrusted host — fall through and let the app handle it
    // (usually a 404 from the route handler).
  }

  // ── Subdomain rewriting ────────────────────────────────────────
  // Check for dev-mode query param first: ?subdomain=plumbing
  const subdomainParam = url.searchParams.get("subdomain")
  const subdomain = subdomainParam ?? extractSubdomain(hostname)

  if (subdomain && VALID_NICHES.has(subdomain)) {
    // Remove the query param so it doesn't propagate
    if (subdomainParam) {
      url.searchParams.delete("subdomain")
    }

    // Rewrite: plumbing.erie.pro/faq -> erie.pro/plumbing/faq
    const path = url.pathname
    url.pathname = `/${subdomain}${path === "/" ? "" : path}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

function extractSubdomain(hostname: string): string | null {
  // Strip port for local dev: "plumbing.localhost:3002" -> "plumbing.localhost"
  const hostWithoutPort = hostname.split(":")[0]
  const parts = hostWithoutPort.split(".")

  // Need at least 3 parts: sub.domain.tld (e.g., plumbing.erie.pro)
  // Or 2 parts for localhost: sub.localhost
  if (parts.length >= 3) {
    const sub = parts[0]
    if (sub !== "www") return sub
  }

  // Handle local dev: plumbing.localhost
  if (parts.length === 2 && parts[1] === "localhost") {
    return parts[0]
  }

  return null
}

export const config = {
  matcher: [
    // Match all routes except static assets
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-touch-icon.png|manifest.json|og-default.png).*)",
  ],
}
