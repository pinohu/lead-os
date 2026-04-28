import { isAllowedWidgetOrigin } from "@/lib/tenant";

export function buildCorsHeaders(origin?: string | null) {
  const allowed = isAllowedWidgetOrigin(origin);
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
