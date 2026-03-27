import { isAllowedWidgetOrigin } from "@/lib/tenant";

export function buildCorsHeaders(origin?: string | null) {
  const allowed = isAllowedWidgetOrigin(origin);
  const allowedOrigin = allowed && origin ? origin : "*";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    // Only advertise the Authorization header when the response is scoped to a
    // specific origin. Sending it with a wildcard origin is a CORS
    // misconfiguration that browsers reject for credentialed requests and that
    // signals to clients that auth tokens should be forwarded to public
    // endpoints.
    "Access-Control-Allow-Headers":
      allowedOrigin !== "*" ? "Content-Type, Authorization" : "Content-Type",
    // Inform caches that the response varies by Origin so that a cached
    // wildcard response is never served to a credentialed origin request.
    Vary: "Origin",
  };
}
