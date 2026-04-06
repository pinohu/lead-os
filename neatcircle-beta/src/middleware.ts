import { NextRequest, NextResponse } from "next/server";

const AUTOMATION_SECRET_HEADER = "x-automation-secret";

function getAutomationSecret() {
  return process.env.AUTOMATION_API_SECRET ?? "";
}

function getDashboardSecret() {
  return process.env.DASHBOARD_SECRET ?? "";
}

function getCronSecret() {
  return process.env.CRON_SECRET ?? "";
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function reject(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

function allow(request: NextRequest) {
  return NextResponse.next();
}

function hasBearerToken(request: NextRequest, expected: string) {
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${expected}`;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/api/dashboard/metrics") {
    const dashboardSecret = getDashboardSecret();
    if (!dashboardSecret) {
      return isLocalHost(request.nextUrl.hostname)
        ? allow(request)
        : reject(503, "DASHBOARD_SECRET must be configured.");
    }

    return hasBearerToken(request, dashboardSecret)
      ? allow(request)
      : reject(401, "Unauthorized");
  }

  if (pathname.startsWith("/api/cron/")) {
    const cronSecret = getCronSecret();
    if (!cronSecret) {
      return isLocalHost(request.nextUrl.hostname)
        ? allow(request)
        : reject(503, "CRON_SECRET must be configured.");
    }

    return hasBearerToken(request, cronSecret)
      ? allow(request)
      : reject(401, "Unauthorized");
  }

  if (pathname === "/api/automations/health" || pathname.startsWith("/api/automations/")) {
    const automationSecret = getAutomationSecret();
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
    "/api/automations/:path*",
    "/api/dashboard/metrics",
    "/api/cron/:path*",
  ],
};
