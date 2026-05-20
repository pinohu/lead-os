// erie-pro/src/lib/convertbox-placement-policy.ts
// Mirrors ConvertBox dashboard excludeTargets — do not load visitor overlays on auth/admin pages.

const CONVERTBOX_BLOCKED_PREFIXES = [
  "/admin",
  "/dashboard",
  "/provider",
  "/login",
  "/privacy",
  "/terms",
  "/api",
  "/manage-data",
  "/for-business/checkout",
] as const

export function normalizePathname(pathname: string): string {
  const pathOnly = pathname.split("?")[0].split("#")[0]
  if (!pathOnly || pathOnly === "/") return "/"
  return pathOnly.endsWith("/") ? pathOnly.slice(0, -1) : pathOnly
}

export function isConvertBoxBlockedPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname)
  return CONVERTBOX_BLOCKED_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  )
}

/** Whether the public ConvertBox embed should load for this pathname. */
export function shouldLoadConvertBox(pathname: string): boolean {
  if (process.env.NEXT_PUBLIC_CONVERTBOX_ENABLED === "false") return false
  return !isConvertBoxBlockedPath(pathname)
}
