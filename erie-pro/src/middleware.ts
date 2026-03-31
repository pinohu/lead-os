import { NextRequest, NextResponse } from "next/server"

const VALID_NICHES = new Set([
  "plumbing",
  "hvac",
  "electrical",
  "roofing",
  "landscaping",
  "dental",
  "legal",
  "cleaning",
  "auto-repair",
  "pest-control",
  "painting",
  "real-estate",
])

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? ""
  const url = request.nextUrl.clone()

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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
