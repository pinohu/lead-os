import { isAllowedWidgetOrigin } from "@/lib/tenant";

function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(",").map((o) => o.trim()).filter(Boolean);
  }
  return [];
}

function isOriginPermitted(origin: string): boolean {
  // Widget origins configured in tenant config
  if (isAllowedWidgetOrigin(origin)) return true;

  // Explicitly configured CORS origins
  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.length > 0) {
    return allowedOrigins.includes(origin);
  }

  // In development, allow localhost origins
  if (process.env.NODE_ENV !== "production") {
    try {
      const url = new URL(origin);
      return url.hostname === "localhost" || url.hostname === "127.0.0.1";
    } catch {
      return false;
    }
  }

  // Production with no ALLOWED_ORIGINS set: same-origin only (no wildcard)
  return false;
}

export function buildCorsHeaders(origin?: string | null) {
  const permitted = origin ? isOriginPermitted(origin) : false;
  const effectiveOrigin = permitted && origin ? origin : "";

  // When no origin is permitted, omit Access-Control-Allow-Origin entirely
  // to enforce same-origin policy. Returning an empty string or wildcard in
  // production would weaken security.
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    Vary: "Origin",
  };

  if (effectiveOrigin) {
    headers["Access-Control-Allow-Origin"] = effectiveOrigin;
    headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
  } else {
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  }

  return headers;
}
