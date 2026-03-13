import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  if (pathname === "/api/automations/health") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/dashboard/metrics")) {
    const dashboardSecret = process.env.DASHBOARD_SECRET ?? "";
    if (!dashboardSecret) {
      return isTrustedBrowserRequest(request)
        ? NextResponse.next()
        : reject(401, "Dashboard metrics require a trusted browser request.");
    }

    if (hasBearerToken(request, dashboardSecret) || isTrustedBrowserRequest(request)) {
      return NextResponse.next();
    }

    return reject(401, "Unauthorized");
  }

  if (pathname.startsWith("/api/cron/nurture")) {
    const cronSecret = process.env.CRON_SECRET ?? "";
    if (!cronSecret) {
      return isLocalHost(request.nextUrl.hostname)
        ? NextResponse.next()
        : reject(503, "CRON_SECRET must be configured.");
    }

    return hasBearerToken(request, cronSecret)
      ? NextResponse.next()
      : reject(401, "Unauthorized");
  }

  if (pathname.startsWith("/api/automations/")) {
    const automationSecret = process.env.AUTOMATION_API_SECRET ?? "";
    if (!automationSecret) {
      return isLocalHost(request.nextUrl.hostname)
        ? NextResponse.next()
        : reject(503, "AUTOMATION_API_SECRET must be configured.");
    }

    return hasBearerToken(request, automationSecret)
      ? NextResponse.next()
      : reject(401, "Unauthorized");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/automations/:path*",
    "/api/dashboard/metrics",
    "/api/cron/nurture",
  ],
};
