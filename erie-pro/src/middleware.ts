// erie-pro/src/middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isSeoPublishGateEnabled, shouldNoindexPath } from "@/lib/seo-publish-gate"
import { getAreaNicheCanonicalPath } from "@/lib/area-niche-urls"
import { getNicheBySlug } from "@/lib/niches"
import { getServiceAreaBySlug } from "@/lib/area-registry"
import { isReservedNicheSegment } from "@/lib/service-modifiers"
import { resolveModifierFromSegment } from "@/lib/modifier-segment-aliases"

function redirectCanonicalAreaMatrix(request: NextRequest) {
  const segments = request.nextUrl.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean)
  if (segments[0] !== "areas" || segments.length !== 3) return null

  const [, areaSlug, nicheSlug] = segments
  if (!getNicheBySlug(nicheSlug) || !getServiceAreaBySlug(areaSlug)) return null

  const target = new URL(getAreaNicheCanonicalPath(nicheSlug, areaSlug), request.url)
  return NextResponse.redirect(target, 308)
}

function redirectModifierAliasSegment(request: NextRequest) {
  const segments = request.nextUrl.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean)
  if (segments.length !== 2) return null

  const [nicheSlug, segment] = segments
  if (!getNicheBySlug(nicheSlug) || isReservedNicheSegment(segment)) return null

  const modifierSlug = resolveModifierFromSegment(nicheSlug, segment)
  if (!modifierSlug) return null

  return NextResponse.redirect(new URL(`/${nicheSlug}/modifiers/${modifierSlug}`, request.url), 308)
}

export function middleware(request: NextRequest) {
  const canonicalRedirect =
    redirectCanonicalAreaMatrix(request) ?? redirectModifierAliasSegment(request)
  if (canonicalRedirect) return canonicalRedirect

  if (!isSeoPublishGateEnabled()) return NextResponse.next()

  if (!shouldNoindexPath(request.nextUrl.pathname)) return NextResponse.next()

  const response = NextResponse.next()
  response.headers.set("X-Robots-Tag", "noindex, follow")
  return response
}

export const config = {
  matcher: ["/((?!api|_next|admin|dashboard|login|favicon|icon|manifest|robots\\.txt|sitemap).*)"],
}
