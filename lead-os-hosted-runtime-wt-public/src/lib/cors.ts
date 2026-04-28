import { isAllowedWidgetOrigin, tenantConfig } from "./tenant.ts";

function matchesCanonicalSiteOrigin(origin: string) {
  try {
    return new URL(origin).origin === new URL(tenantConfig.siteUrl).origin;
  } catch {
    return false;
  }
}

export function isAllowedCorsPostOrigin(origin?: string | null) {
  if (!origin) return false;
  return isAllowedWidgetOrigin(origin) || matchesCanonicalSiteOrigin(origin);
}

export function buildCorsHeaders(origin?: string | null) {
  const allowed = isAllowedCorsPostOrigin(origin);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };

  if (allowed && origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}
