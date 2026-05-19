// erie-pro/src/lib/page-audience-registry.ts
// Maps route patterns to primary audience and CTA policy.

import type { Audience, AllowProviderCTA, PageAudienceConfig } from "@/lib/audience-context"
import { getPageAudienceConfig } from "@/lib/audience-context"

export interface PageAudienceRegistryEntry {
  /** Path pattern: exact path, or prefix ending with `/*` */
  pattern: string
  audience: Audience
  allowProviderCTA?: AllowProviderCTA
  primary_goal?: string
  forbidden_messages?: readonly string[]
}

/**
 * First matching pattern wins (most specific routes should appear first).
 */
export const PAGE_AUDIENCE_REGISTRY: readonly PageAudienceRegistryEntry[] = [
  // Admin
  { pattern: "/admin/*", audience: "admin", allowProviderCTA: "none" },

  // Provider portal & acquisition
  { pattern: "/dashboard/*", audience: "provider", allowProviderCTA: "primary" },
  { pattern: "/dashboard", audience: "provider", allowProviderCTA: "primary" },
  { pattern: "/for-business/*", audience: "provider", allowProviderCTA: "primary" },
  { pattern: "/for-business", audience: "provider", allowProviderCTA: "primary" },
  { pattern: "/pros", audience: "provider", allowProviderCTA: "primary" },
  { pattern: "/providers/*", audience: "provider", allowProviderCTA: "primary" },
  { pattern: "/provider/*", audience: "provider", allowProviderCTA: "primary" },
  { pattern: "/offers/*", audience: "provider", allowProviderCTA: "secondary" },
  { pattern: "/offer-assets/*", audience: "provider", allowProviderCTA: "secondary" },
  { pattern: "/login", audience: "provider", allowProviderCTA: "secondary" },
  { pattern: "/forgot-password", audience: "provider", allowProviderCTA: "none" },
  { pattern: "/reset-password", audience: "provider", allowProviderCTA: "none" },
  { pattern: "/verify-email", audience: "provider", allowProviderCTA: "none" },
  { pattern: "/website-preview/*", audience: "provider", allowProviderCTA: "secondary" },

  // Consumer directory & profiles (dynamic niches)
  { pattern: "/*/*/directory", audience: "consumer", allowProviderCTA: "footer-utility" },
  { pattern: "/*/*/modifiers/*", audience: "consumer", allowProviderCTA: "footer-utility" },
  { pattern: "/*/*/areas/*", audience: "consumer", allowProviderCTA: "footer-utility" },
  { pattern: "/*/*", audience: "consumer", allowProviderCTA: "footer-utility" },
  { pattern: "/*", audience: "consumer", allowProviderCTA: "footer-utility" },
  { pattern: "/areas/*/*", audience: "consumer", allowProviderCTA: "footer-utility" },
  { pattern: "/areas/*", audience: "consumer", allowProviderCTA: "footer-utility" },
  { pattern: "/areas", audience: "consumer", allowProviderCTA: "footer-utility" },
  { pattern: "/directory", audience: "consumer", allowProviderCTA: "footer-utility" },
  { pattern: "/services", audience: "consumer", allowProviderCTA: "footer-utility" },
  { pattern: "/get-matched", audience: "consumer", allowProviderCTA: "none" },
  { pattern: "/emergency", audience: "consumer", allowProviderCTA: "footer-utility" },
  { pattern: "/pricing", audience: "consumer", allowProviderCTA: "footer-utility" },
  { pattern: "/lead-status", audience: "consumer", allowProviderCTA: "none" },
  {
    pattern: "/request-status/*",
    audience: "consumer",
    allowProviderCTA: "none",
    primary_goal: "Track service request status and notifications",
  },
  { pattern: "/concierge/*", audience: "consumer", allowProviderCTA: "none" },
  { pattern: "/contact", audience: "consumer", allowProviderCTA: "footer-utility" },
  { pattern: "/about", audience: "consumer", allowProviderCTA: "footer-utility" },
  { pattern: "/privacy", audience: "consumer", allowProviderCTA: "none" },
  { pattern: "/terms", audience: "consumer", allowProviderCTA: "none" },
  { pattern: "/manage-data", audience: "consumer", allowProviderCTA: "footer-utility" },
  { pattern: "/funnels/*", audience: "consumer", allowProviderCTA: "footer-utility" },
  { pattern: "/", audience: "consumer", allowProviderCTA: "footer-utility" },
] as const

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/"
  const withoutQuery = pathname.split("?")[0]?.split("#")[0] ?? pathname
  const trimmed = withoutQuery.replace(/\/+$/, "") || "/"
  return trimmed
}

function pathSegments(pathname: string): string[] {
  return normalizePathname(pathname).split("/").filter(Boolean)
}

function patternMatches(pattern: string, pathname: string): boolean {
  const path = normalizePathname(pathname)
  if (!pattern.includes("*")) {
    return pattern === path
  }

  if (pattern === "/*") {
    return pathSegments(path).length === 1
  }

  if (pattern === "/*/*") {
    return pathSegments(path).length === 2
  }

  if (pattern === "/*/*/directory") {
    const segments = pathSegments(path)
    return segments.length === 3 && segments[2] === "directory"
  }

  if (pattern === "/*/*/modifiers/*") {
    const segments = pathSegments(path)
    return segments.length === 4 && segments[2] === "modifiers"
  }

  if (pattern === "/*/*/areas/*") {
    const segments = pathSegments(path)
    return segments.length === 4 && segments[2] === "areas"
  }

  if (pattern.endsWith("/*")) {
    const base = pattern.slice(0, -2)
    return path === base || path.startsWith(`${base}/`)
  }

  return false
}

export function resolveAudienceFromPathname(pathname: string): PageAudienceConfig {
  const path = normalizePathname(pathname)
  const entry = PAGE_AUDIENCE_REGISTRY.find((row) => patternMatches(row.pattern, path))
  if (!entry) {
    return getPageAudienceConfig("consumer")
  }

  const base = getPageAudienceConfig(entry.audience)
  return {
    ...base,
    audience: entry.audience,
    primary_goal: entry.primary_goal ?? base.primary_goal,
    forbidden_messages: entry.forbidden_messages ?? base.forbidden_messages,
    allowProviderCTA: entry.allowProviderCTA ?? base.allowProviderCTA,
  }
}

export function isProviderProfilePath(pathname: string): boolean {
  const path = normalizePathname(pathname)
  const segments = path.split("/").filter(Boolean)
  if (segments.length !== 2) return false
  const reserved = new Set([
    "admin",
    "api",
    "areas",
    "dashboard",
    "directory",
    "for-business",
    "pros",
    "providers",
    "provider",
    "services",
    "get-matched",
    "emergency",
    "pricing",
    "login",
    "contact",
    "about",
    "privacy",
    "terms",
    "offers",
    "funnels",
  ])
  return !reserved.has(segments[0]!)
}
