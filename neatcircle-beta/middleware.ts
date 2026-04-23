import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { embeddedSecrets } from "@/lib/embedded-secrets";

function getHostname(value: string | null) {
  if (!value) return "";
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function isTrustedBrowserRequest(request: NextRequest) {
  const requestHost = request.nextUrl.hostname.toLowerCase();
  const originHost = getHostname(request.headers.get("origin"));
  const refererHost = getHostname(request.headers.get("referer"));
  const fetchSite = request.headers.get("sec-fetch-site");

  if (originHost && (originHost === requestHost || isLocalHost(originHost))) {
    return true;
  }

  if (refererHost && (refererHost === requestHost || isLocalHost(refererHost))) {
    return true;
  }

  return fetchSite === "same-origin" || fetchSite === "same-site";
}

function hasBearerToken(request: NextRequest, secret: string) {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

function reject(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

function applyResponseHeaders(request: NextRequest, response: NextResponse) {
  if (request.nextUrl.hostname.endsWith(".workers.dev")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  }

  return response;
}

function allow(request: NextRequest) {
  return applyResponseHeaders(request, NextResponse.next());
}

// --------------- Inline rate limiter (edge-compatible) ---------------
interface RLEntry { count: number; resetAt: number }
const rlStore = new Map<string, RLEntry>();
const GENERAL_WINDOW_MS = 60_000;
const GENERAL_MAX = 30;
const ANALYZE_WINDOW_MS = 60_000;
const ANALYZE_MAX = 5;

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function checkRateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rlStore.get(key);

  if (!entry || entry.resetAt <= now) {
    rlStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

// Periodic cleanup (best-effort in edge; runs per-invocation instead of setInterval)
let lastCleanup = 0;
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 30_000) return;
  lastCleanup = now;
  for (const [key, entry] of rlStore) {
    if (entry.resetAt <= now) rlStore.delete(key);
  }
}
// ---------------------------------------------------------------------

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.method === "OPTIONS") {
    return allow(request);
  }

  // --- Rate limiting for /api/* routes ---
  if (pathname.startsWith("/api/")) {
    maybeCleanup();
    const ip = getClientIp(request);

    if (pathname.startsWith("/api/intelligence/analyze")) {
      const rl = checkRateLimit(`analyze:${ip}`, ANALYZE_MAX, ANALYZE_WINDOW_MS);
      if (!rl.allowed) {
        return reject(429, "Too many requests. Please try again later.");
      }
    }

    const rl = checkRateLimit(`api:${ip}`, GENERAL_MAX, GENERAL_WINDOW_MS);
    if (!rl.allowed) {
      return reject(429, "Too many requests. Please try again later.");
    }
  }

  // --- Existing auth checks ---

  if (pathname === "/api/automations/health") {
    return allow(request);
  }

  if (pathname === "/api/automations/smoke") {
    return isTrustedBrowserRequest(request)
      ? allow(request)
      : reject(401, "Automation smoke requires a trusted browser request.");
  }

  if (pathname.startsWith("/api/dashboard/metrics")) {
    const dashboardSecret = process.env.DASHBOARD_SECRET ?? embeddedSecrets.dashboard.secret;
    if (!dashboardSecret) {
      return isTrustedBrowserRequest(request)
        ? allow(request)
        : reject(401, "Dashboard metrics require a trusted browser request.");
    }

    if (hasBearerToken(request, dashboardSecret) || isTrustedBrowserRequest(request)) {
      return allow(request);
    }

    return reject(401, "Unauthorized");
  }

  if (pathname.startsWith("/api/cron/nurture")) {
    const cronSecret = process.env.CRON_SECRET ?? embeddedSecrets.cron.secret;
    if (!cronSecret) {
      return isLocalHost(request.nextUrl.hostname)
        ? allow(request)
        : reject(503, "CRON_SECRET must be configured.");
    }

    return hasBearerToken(request, cronSecret)
      ? allow(request)
      : reject(401, "Unauthorized");
  }

  if (pathname.startsWith("/api/automations/")) {
    const automationSecret = process.env.AUTOMATION_API_SECRET ?? embeddedSecrets.automation.apiSecret;
    const internalSmokeRequest =
      request.headers.get("x-lead-os-internal-smoke") === "1" &&
      request.headers.get("x-lead-os-dry-run") === "1";

    if (internalSmokeRequest) {
      return allow(request);
    }

    if (!automationSecret) {
      return isLocalHost(request.nextUrl.hostname)
        ? allow(request)
        : reject(503, "AUTOMATION_API_SECRET must be configured.");
    }

    return hasBearerToken(request, automationSecret)
      ? allow(request)
      : reject(401, "Unauthorized");
  }

  return allow(request);
}

export const config = {
  matcher: [
    "/api/:path*",
  ],
};
