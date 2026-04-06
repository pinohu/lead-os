import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { buildCorsHeaders } from "@/lib/cors";
import { createRateLimiter } from "@/lib/rate-limiter";
import { startTrace } from "@/lib/request-tracer";

// ---------------------------------------------------------------------------
// Rate limiter for auth endpoints — 10 requests per minute per IP
// ---------------------------------------------------------------------------

const authRateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
});

// ---------------------------------------------------------------------------
// Content Security Policy
// PRODUCTION TODO: Tighten 'unsafe-inline' and 'unsafe-eval' in script-src
// and 'unsafe-inline' in style-src once Next.js nonce-based CSP is configured.
// These are required during development but should be replaced with nonce or
// hash-based directives for production hardening.
// ---------------------------------------------------------------------------

const CSP_DIRECTIVES = [
  "default-src 'self'",
  // TODO: Replace 'unsafe-inline' with nonce-based CSP once Next.js nonce infrastructure is configured
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "connect-src 'self' https:",
  "font-src 'self' https: data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

// ---------------------------------------------------------------------------
// Public route patterns — no authentication required
// All /api/* routes require auth by default. Only routes listed here are exempt.
// ---------------------------------------------------------------------------

const PUBLIC_EXACT: Set<string> = new Set([
  "/api/health",
  "/api/health/deep",
  "/api/status",
  "/api/intake",
  "/api/capture",
  "/api/unsubscribe",
  "/api/setup/status",
  "/api/contact",
]);

const PUBLIC_PREFIXES: string[] = [
  "/api/tracking/",
  "/api/embed/",
  "/api/widgets/boot",
  "/api/auth/",
  "/api/gdpr/",
  "/api/preferences",
  "/api/webhooks/stripe",
];

function isPublicRoute(pathname: string, method: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;

  // GET-only public route
  if (pathname === "/api/marketplace/leads" && method === "GET") return true;

  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Identity header helpers
// ---------------------------------------------------------------------------

interface IdentityHeaders {
  "x-authenticated-user-id": string;
  "x-authenticated-role": string;
  "x-authenticated-tenant-id": string;
  "x-authenticated-method": string;
}

// Middleware signature — proves the request went through middleware.
// Routes should check for this header to prevent header spoofing.
// LEAD_OS_AUTH_SECRET must be set in all environments; no hardcoded fallback.
const MIDDLEWARE_SIGNATURE_KEY = process.env.LEAD_OS_AUTH_SECRET ?? "";

function computeMiddlewareSignature(userId: string, tenantId: string, requestId: string): string {
  const payload = `${userId}:${tenantId}:${requestId}`;
  return `mw1-${createHmac("sha256", MIDDLEWARE_SIGNATURE_KEY)
    .update(payload)
    .digest("hex")}`;
}

function forwardWithIdentity(
  request: NextRequest,
  requestId: string,
  identity: IdentityHeaders,
): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-authenticated-user-id", identity["x-authenticated-user-id"]);
  requestHeaders.set("x-authenticated-role", identity["x-authenticated-role"]);
  requestHeaders.set("x-authenticated-tenant-id", identity["x-authenticated-tenant-id"]);
  requestHeaders.set("x-authenticated-method", identity["x-authenticated-method"]);
  requestHeaders.set(
    "x-middleware-signature",
    computeMiddlewareSignature(
      identity["x-authenticated-user-id"],
      identity["x-authenticated-tenant-id"],
      requestId,
    ),
  );

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  return applySecurityHeaders(response, requestId);
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

function applySecurityHeaders(response: NextResponse, requestId: string): NextResponse {
  response.headers.set("x-request-id", requestId);
  response.headers.set("x-api-version", "2026-03-30");
  response.headers.set("Content-Security-Policy", CSP_DIRECTIVES);
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  return response;
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { pathname } = request.nextUrl;
  const method = request.method;

  startTrace(requestId, method, pathname, request.headers.get("user-agent"));

  // Non-API routes (pages) — pass through, pages handle their own auth
  if (!pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    return applySecurityHeaders(response, requestId);
  }

  // Fail-safe: LEAD_OS_AUTH_SECRET must be configured for API routes
  if (!MIDDLEWARE_SIGNATURE_KEY) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "SERVER_MISCONFIGURED",
          message: "Server misconfigured: LEAD_OS_AUTH_SECRET is not set",
        },
        meta: { requestId },
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }

  // Handle CORS preflight requests globally
  if (method === "OPTIONS") {
    const headers = buildCorsHeaders(request.headers.get("origin"));
    const response = new NextResponse(null, {
      status: 204,
      headers: { ...headers, "x-request-id": requestId },
    });
    response.headers.set("x-api-version", "2026-03-30");
    response.headers.set("Content-Security-Policy", CSP_DIRECTIVES);
    return response;
  }

  // Rate limit auth endpoints: 10 requests per minute per IP
  if (pathname.startsWith("/api/auth/")) {
    const clientIp = getClientIp(request);
    const rateLimitKey = `auth:${clientIp}`;
    const result = authRateLimiter.check(rateLimitKey);

    if (!result.allowed) {
      const retryAfterSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "RATE_LIMITED",
            message: "Too many authentication requests. Please try again later.",
          },
          meta: { requestId },
        },
        {
          status: 429,
          headers: {
            "x-request-id": requestId,
            "x-api-version": "2026-03-30",
            "Retry-After": String(retryAfterSeconds),
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
          },
        },
      );
    }
  }

  // Passthrough for public API routes without touching auth modules
  if (isPublicRoute(pathname, method)) {
    const response = NextResponse.next();
    return applySecurityHeaders(response, requestId);
  }

  // Cron secret — fast path, no DB required
  const cronSecret = request.headers.get("x-cron-secret");
  const expectedCronSecret = process.env.CRON_SECRET;
  if (cronSecret && expectedCronSecret && cronSecret.length === expectedCronSecret.length &&
    timingSafeEqual(Buffer.from(cronSecret), Buffer.from(expectedCronSecret))) {
    const response = NextResponse.next();
    return applySecurityHeaders(response, requestId);
  }

  // Authenticated paths — dynamic import keeps auth-system out of the public
  // route bundle
  const { validateApiKey, validateSession, getUserById } = await import(
    "@/lib/auth-system"
  );

  // --- Bearer token (API key: los_*) ---
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer los_")) {
    const rawKey = authHeader.slice(7).trim();
    if (rawKey) {
      const result = await validateApiKey(rawKey);
      if (result) {
        return forwardWithIdentity(request, requestId, {
          "x-authenticated-user-id": result.user.id,
          "x-authenticated-role": result.user.role,
          "x-authenticated-tenant-id": result.user.tenantId,
          "x-authenticated-method": "api-key",
        });
      }
    }
  }

  // --- Bearer token (session: sess_*) ---
  if (authHeader?.startsWith("Bearer sess_")) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const session = await validateSession(token);
      if (session) {
        const user = await getUserById(session.userId);
        if (user && user.status === "active") {
          return forwardWithIdentity(request, requestId, {
            "x-authenticated-user-id": user.id,
            "x-authenticated-role": user.role,
            "x-authenticated-tenant-id": user.tenantId,
            "x-authenticated-method": "session",
          });
        }
      }
    }
  }

  // --- X-API-Key header ---
  const apiKey = request.headers.get("x-api-key");
  if (apiKey) {
    const result = await validateApiKey(apiKey);
    if (result) {
      return forwardWithIdentity(request, requestId, {
        "x-authenticated-user-id": result.user.id,
        "x-authenticated-role": result.user.role,
        "x-authenticated-tenant-id": result.user.tenantId,
        "x-authenticated-method": "api-key",
      });
    }
  }

  // --- leados_session cookie (sess_*) ---
  const sessionCookieValue = request.cookies.get("leados_session")?.value;
  if (sessionCookieValue?.startsWith("sess_")) {
    const session = await validateSession(sessionCookieValue);
    if (session) {
      const user = await getUserById(session.userId);
      if (user && user.status === "active") {
        return forwardWithIdentity(request, requestId, {
          "x-authenticated-user-id": user.id,
          "x-authenticated-role": user.role,
          "x-authenticated-tenant-id": user.tenantId,
          "x-authenticated-method": "session",
        });
      }
    }
  }

  // --- leados_operator_session cookie (operator JWT) ---
  const { getOperatorSessionFromCookieHeader } = await import(
    "@/lib/operator-auth"
  );
  const { tenantConfig } = await import("@/lib/tenant");
  const cookieHeader = request.headers.get("cookie");
  const operatorSession = await getOperatorSessionFromCookieHeader(cookieHeader);
  if (operatorSession) {
    return forwardWithIdentity(request, requestId, {
      "x-authenticated-user-id": operatorSession.email,
      "x-authenticated-role": "owner",
      "x-authenticated-tenant-id": tenantConfig.tenantId,
      "x-authenticated-method": "operator-cookie",
    });
  }

  return NextResponse.json(
    {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
      meta: { requestId },
    },
    { status: 401, headers: { "x-request-id": requestId, "x-api-version": "2026-03-30" } },
  );
}

// ---------------------------------------------------------------------------
// Matcher — only API routes; skip Next.js internals and static assets
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
