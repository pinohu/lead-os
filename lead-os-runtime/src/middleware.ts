import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { buildCorsHeaders } from "@/lib/cors";
import { createRateLimiter } from "@/lib/rate-limiter";
import { startTrace } from "@/lib/request-tracer";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Rate limiter for auth endpoints — 10 requests per minute per IP
// ---------------------------------------------------------------------------

const authRateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
});

const publicApiRateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: Number(process.env.LEAD_OS_PUBLIC_API_RATE_LIMIT ?? 180),
});

// ---------------------------------------------------------------------------
// Content Security Policy (per-request nonce for script-src; no unsafe-inline)
// ---------------------------------------------------------------------------

function buildContentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https:",
    "font-src 'self' https: data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

// ---------------------------------------------------------------------------
// Public route patterns — no authentication required
// All /api/* routes require auth by default. Only routes listed here are exempt.
// ---------------------------------------------------------------------------

const PUBLIC_EXACT: Set<string> = new Set([
  "/api/health",
  "/api/health/deep",
  "/api/system",
  "/api/status",
  "/api/intake",
  "/api/capture",
  "/api/unsubscribe",
  "/api/setup/status",
  "/api/contact",
]);

const X_AUTH_SECRET_EXACT: Set<string> = new Set([
  "/api/operator/leads",
]);

const PUBLIC_PREFIXES: string[] = [
  "/api/tracking/",
  "/api/embed/",
  "/api/widgets/boot",
  "/api/auth/",
  "/api/gdpr/",
  "/api/preferences",
  "/api/webhooks/stripe",
  "/api/billing/webhook",
  "/api/billing/stripe/",
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

function isXAuthSecretRoute(pathname: string): boolean {
  return X_AUTH_SECRET_EXACT.has(pathname);
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
  return createHmac("sha256", MIDDLEWARE_SIGNATURE_KEY)
    .update(payload)
    .digest("hex");
}

function forwardWithIdentity(
  request: NextRequest,
  requestId: string,
  identity: IdentityHeaders,
  cspNonce: string,
): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-csp-nonce", cspNonce);
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
  return applySecurityHeaders(response, requestId, cspNonce);
}

async function forwardWithIdentityAndPolicies(
  request: NextRequest,
  requestId: string,
  identity: IdentityHeaders,
  cspNonce: string,
): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const method = request.method;
  const { tenantConfig } = await import("@/lib/tenant");
  const deployTenant = tenantConfig.tenantId;

  if (process.env.LEAD_OS_SINGLE_TENANT_ENFORCE !== "false") {
    if (identity["x-authenticated-tenant-id"] !== deployTenant) {
      const { pricingLog } = await import("@/lib/pricing/logger");
      pricingLog("warn", "request_tenant_mismatch", {
        pathname,
        method,
        requestId,
        headerTenant: identity["x-authenticated-tenant-id"],
        deployTenant,
      });
      return applySecurityHeaders(
        NextResponse.json(
          {
            data: null,
            error: {
              code: "TENANT_MISMATCH",
              message: "Authenticated tenant does not match LEAD_OS_TENANT_ID for this deployment",
            },
            meta: { requestId },
          },
          { status: 403, headers: { "x-request-id": requestId, "x-api-version": "2026-03-30" } },
        ),
        requestId,
        cspNonce,
      );
    }
  }

  if (process.env.LEAD_OS_BILLING_ENFORCE === "true") {
    const { getRequiredApiAccessTier } = await import("@/lib/billing/api-route-tier");
    const { getBillingGateStateCached } = await import("@/lib/billing/billing-gate-cache");
    const { assertApiAccessTierAllows } = await import("@/lib/billing/entitlements");
    const { pricingLog } = await import("@/lib/pricing/logger");
    const tier = getRequiredApiAccessTier(pathname, method);
    const state = await getBillingGateStateCached(deployTenant);
    if (!state.subscriptionActive) {
      pricingLog("warn", "billing_middleware_blocked", {
        pathname,
        method,
        requestId,
        reason: "subscription_inactive",
      });
      return applySecurityHeaders(
        NextResponse.json(
          {
            data: null,
            error: {
              code: "BILLING_BLOCKED",
              message: "Subscription inactive or missing for this tenant",
              blockReason: "subscription_inactive",
            },
            meta: { requestId },
          },
          { status: 402, headers: { "x-request-id": requestId, "x-api-version": "2026-03-30" } },
        ),
        requestId,
        cspNonce,
      );
    }
    if (!assertApiAccessTierAllows(state, tier)) {
      pricingLog("warn", "billing_middleware_blocked", {
        pathname,
        method,
        requestId,
        reason: "api_tier",
        required: tier,
        actual: state.apiAccessTier,
      });
      return applySecurityHeaders(
        NextResponse.json(
          {
            data: null,
            error: {
              code: "BILLING_BLOCKED",
              message: "Plan API tier insufficient for this route",
              blockReason: "api_tier",
              required: tier,
            },
            meta: { requestId },
          },
          { status: 402, headers: { "x-request-id": requestId, "x-api-version": "2026-03-30" } },
        ),
        requestId,
        cspNonce,
      );
    }
  }

  return forwardWithIdentity(request, requestId, identity, cspNonce);
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

function applySecurityHeaders(response: NextResponse, requestId: string, cspNonce: string): NextResponse {
  response.headers.set("x-request-id", requestId);
  response.headers.set("x-api-version", "2026-03-30");
  const buildId = process.env.LEAD_OS_BUILD_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "";
  if (buildId) {
    response.headers.set("x-leados-build-id", buildId);
  }
  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy(cspNonce));
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

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const cspNonce = randomBytes(16).toString("base64");
  const { pathname } = request.nextUrl;
  const method = request.method;

  startTrace(requestId, method, pathname, request.headers.get("user-agent"));

  // Non-API routes (pages) — pass through; attach pathname for server layouts (e.g. operator redirect)
  if (!pathname.startsWith("/api/")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-leados-pathname", pathname);
    requestHeaders.set("x-csp-nonce", cspNonce);
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    return applySecurityHeaders(response, requestId, cspNonce);
  }

  // Fail-safe: LEAD_OS_AUTH_SECRET must be configured for API routes
  if (!MIDDLEWARE_SIGNATURE_KEY) {
    return applySecurityHeaders(
      NextResponse.json(
        {
          data: null,
          error: {
            code: "SERVER_MISCONFIGURED",
            message: "Server misconfigured: LEAD_OS_AUTH_SECRET is not set",
          },
          meta: { requestId },
        },
        { status: 500, headers: { "x-request-id": requestId } },
      ),
      requestId,
      cspNonce,
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
    return applySecurityHeaders(response, requestId, cspNonce);
  }

  // Rate limit auth endpoints: 10 requests per minute per IP
  if (pathname.startsWith("/api/auth/")) {
    const clientIp = getClientIp(request);
    const rateLimitKey = `auth:${clientIp}`;
    const result = authRateLimiter.check(rateLimitKey);

    if (!result.allowed) {
      const retryAfterSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);
      return applySecurityHeaders(
        NextResponse.json(
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
        ),
        requestId,
        cspNonce,
      );
    }
  }

  function nextWithNonce(): NextResponse {
    const h = new Headers(request.headers);
    h.set("x-csp-nonce", cspNonce);
    return NextResponse.next({ request: { headers: h } });
  }

  // Passthrough for public API routes without touching auth modules
  if (isPublicRoute(pathname, method)) {
    const clientIp = getClientIp(request);
    const pr = publicApiRateLimiter.check(`public_api:${pathname}:${clientIp}`);
    if (!pr.allowed) {
      const retryAfterSeconds = Math.ceil((pr.resetAt - Date.now()) / 1000);
      return applySecurityHeaders(
        NextResponse.json(
          {
            data: null,
            error: { code: "RATE_LIMITED", message: "Too many public API requests" },
            meta: { requestId },
          },
          {
            status: 429,
            headers: {
              "x-request-id": requestId,
              "x-api-version": "2026-03-30",
              "Retry-After": String(retryAfterSeconds),
            },
          },
        ),
        requestId,
        cspNonce,
      );
    }
    return applySecurityHeaders(nextWithNonce(), requestId, cspNonce);
  }

  // Explicit x-auth-secret routes bypass global auth-system guards and enforce
  // route-local auth (requireAuth) for minimal operator access surfaces.
  if (isXAuthSecretRoute(pathname))
    return applySecurityHeaders(nextWithNonce(), requestId, cspNonce);

  // Cron secret — fast path, no DB required. Timing-safe comparison.
  const cronSecret = request.headers.get("x-cron-secret");
  const envCronSecret = process.env.CRON_SECRET;
  if (cronSecret && envCronSecret) {
    const a = Buffer.from(cronSecret);
    const b = Buffer.from(envCronSecret);
    if (a.length === b.length && timingSafeEqual(a, b)) {
      return applySecurityHeaders(nextWithNonce(), requestId, cspNonce);
    }
  }

  const bearerCronProbe = request.headers.get("authorization");
  if (bearerCronProbe?.startsWith("Bearer ") && envCronSecret) {
    const token = bearerCronProbe.slice("Bearer ".length).trim();
    if (token && !token.startsWith("los_") && !token.startsWith("sess_")) {
      const a = Buffer.from(token);
      const bc = Buffer.from(envCronSecret);
      if (a.length === bc.length && timingSafeEqual(a, bc)) {
        return applySecurityHeaders(nextWithNonce(), requestId, cspNonce);
      }
    }
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
        return await forwardWithIdentityAndPolicies(request, requestId, {
          "x-authenticated-user-id": result.user.id,
          "x-authenticated-role": result.user.role,
          "x-authenticated-tenant-id": result.user.tenantId,
          "x-authenticated-method": "api-key",
        }, cspNonce);
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
          return await forwardWithIdentityAndPolicies(request, requestId, {
            "x-authenticated-user-id": user.id,
            "x-authenticated-role": user.role,
            "x-authenticated-tenant-id": user.tenantId,
            "x-authenticated-method": "session",
          }, cspNonce);
        }
      }
    }
  }

  // --- X-API-Key header ---
  const apiKey = request.headers.get("x-api-key");
  if (apiKey) {
    const result = await validateApiKey(apiKey);
    if (result) {
      return await forwardWithIdentityAndPolicies(request, requestId, {
        "x-authenticated-user-id": result.user.id,
        "x-authenticated-role": result.user.role,
        "x-authenticated-tenant-id": result.user.tenantId,
        "x-authenticated-method": "api-key",
      }, cspNonce);
    }
  }

  // --- leados_session cookie (sess_*) ---
  const sessionCookieValue = request.cookies.get("leados_session")?.value;
  if (sessionCookieValue?.startsWith("sess_")) {
    const session = await validateSession(sessionCookieValue);
    if (session) {
      const user = await getUserById(session.userId);
      if (user && user.status === "active") {
        return await forwardWithIdentityAndPolicies(request, requestId, {
          "x-authenticated-user-id": user.id,
          "x-authenticated-role": user.role,
          "x-authenticated-tenant-id": user.tenantId,
          "x-authenticated-method": "session",
        }, cspNonce);
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
    return await forwardWithIdentityAndPolicies(request, requestId, {
      "x-authenticated-user-id": operatorSession.email,
      "x-authenticated-role": "owner",
      "x-authenticated-tenant-id": tenantConfig.tenantId,
      "x-authenticated-method": "operator-cookie",
    }, cspNonce);
  }

  return applySecurityHeaders(
    NextResponse.json(
      {
        data: null,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
        meta: { requestId },
      },
      { status: 401, headers: { "x-request-id": requestId, "x-api-version": "2026-03-30" } },
    ),
    requestId,
    cspNonce,
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
