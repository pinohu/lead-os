import { isAllowedWidgetOrigin } from "@/lib/tenant";

export function buildCorsHeaders(origin?: string | null) {
  const allowed = isAllowedWidgetOrigin(origin);

  if (!allowed || !origin) {
    return {
      "Access-Control-Allow-Origin": "",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}
