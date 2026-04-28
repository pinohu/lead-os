import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DASHBOARD_AUTH_COOKIE,
  DASHBOARD_AUTH_REALM,
  hasAuthorizationSecret,
  hasConfiguredSecret,
  hasSharedSecretAuth,
} from "@/lib/admin-auth";
import { embeddedSecrets } from "@/lib/embedded-secrets";

const DASHBOARD_AUTH_COOKIE_MAX_AGE = 12 * 60 * 60;

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
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

function rejectWithDashboardChallenge(error: string) {
  return NextResponse.json(
    { error },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Basic realm="${DASHBOARD_AUTH_REALM}", charset="UTF-8"`,
      },
    },
  );
}

function setDashboardCookie(request: NextRequest, response: NextResponse, dashboardSecret: string) {
  if (!hasAuthorizationSecret(request.headers, dashboardSecret)) {
    return response;
  }

  response.cookies.set(DASHBOARD_AUTH_COOKIE, dashboardSecret, {
    httpOnly: true,
    maxAge: DASHBOARD_AUTH_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });

  return response;
}

function requireDashboardAuth(request: NextRequest) {
  const dashboardSecret = process.env.DASHBOARD_SECRET ?? embeddedSecrets.dashboard.secret;

  if (!hasConfiguredSecret(dashboardSecret)) {
    return reject(503, "DASHBOARD_SECRET must be configured.");
  }

  if (!hasSharedSecretAuth(request.headers, dashboardSecret, { cookieNames: [DASHBOARD_AUTH_COOKIE] })) {
    return rejectWithDashboardChallenge("Unauthorized");
  }

  return setDashboardCookie(request, allow(request), dashboardSecret);
}

function requireAutomationAuth(request: NextRequest) {
  const automationSecret = process.env.AUTOMATION_API_SECRET ?? embeddedSecrets.automation.apiSecret;

  if (!hasConfiguredSecret(automationSecret)) {
    return reject(503, "AUTOMATION_API_SECRET must be configured.");
  }

  return hasSharedSecretAuth(request.headers, automationSecret, { allowBasic: false })
    ? allow(request)
    : reject(401, "Unauthorized");
}

function requireSmokeAuth(request: NextRequest) {
  const automationSecret = process.env.AUTOMATION_API_SECRET ?? embeddedSecrets.automation.apiSecret;
  const dashboardSecret = process.env.DASHBOARD_SECRET ?? embeddedSecrets.dashboard.secret;
  const hasAutomationAuth = hasSharedSecretAuth(request.headers, automationSecret, { allowBasic: false });
  const hasDashboardAuth = hasSharedSecretAuth(request.headers, dashboardSecret, {
    cookieNames: [DASHBOARD_AUTH_COOKIE],
  });

  if (!hasConfiguredSecret(automationSecret)) {
    return reject(503, "AUTOMATION_API_SECRET must be configured.");
  }

  if (!hasAutomationAuth && !hasDashboardAuth) {
    return hasConfiguredSecret(dashboardSecret)
      ? rejectWithDashboardChallenge("Unauthorized")
      : reject(401, "Unauthorized");
  }

  const response = allow(request);
  return hasConfiguredSecret(dashboardSecret)
    ? setDashboardCookie(request, response, dashboardSecret)
    : response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.method === "OPTIONS") {
    return allow(request);
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/control-center")) {
    return requireDashboardAuth(request);
  }

  if (pathname.startsWith("/api/dashboard/metrics")) {
    return requireDashboardAuth(request);
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

  if (pathname === "/api/automations/smoke") {
    return requireSmokeAuth(request);
  }

  if (pathname.startsWith("/api/automations/")) {
    return requireAutomationAuth(request);
  }

  return allow(request);
}

export const config = {
  matcher: [
    "/api/automations/:path*",
    "/api/dashboard/metrics",
    "/api/cron/nurture",
    "/dashboard/:path*",
    "/control-center/:path*",
  ],
};
