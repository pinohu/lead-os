import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Public route patterns — no authentication required
// ---------------------------------------------------------------------------

const PUBLIC_EXACT: Set<string> = new Set([
  "/api/health",
  "/api/intake",
  "/api/unsubscribe",
  "/api/realtime/stream",
  "/api/onboarding",
  "/api/social/platforms",
]);

const PUBLIC_PREFIXES: string[] = [
  "/api/tracking/",
  "/api/embed/",
  "/api/widgets/",
  "/api/onboarding/",
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
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Passthrough for public routes without touching auth modules
  if (isPublicRoute(pathname, method)) {
    const response = NextResponse.next();
    response.headers.set("x-request-id", requestId);
    return response;
  }

  // Cron secret — fast path, no DB required
  const cronSecret = request.headers.get("x-cron-secret");
  if (cronSecret && cronSecret === process.env.CRON_SECRET) {
    const response = NextResponse.next();
    response.headers.set("x-request-id", requestId);
    return response;
  }

  // Authenticated paths — dynamic import keeps auth-system out of the public
  // route bundle
  const { validateApiKey, validateSession } = await import(
    "@/lib/auth-system"
  );

  // --- Bearer token ---
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const result = await validateApiKey(token);
      if (result) {
        const response = NextResponse.next();
        response.headers.set("x-request-id", requestId);
        return response;
      }
    }
  }

  // --- X-API-Key header ---
  const apiKey = request.headers.get("x-api-key");
  if (apiKey) {
    const result = await validateApiKey(apiKey);
    if (result) {
      const response = NextResponse.next();
      response.headers.set("x-request-id", requestId);
      return response;
    }
  }

  // --- x-operator-session cookie ---
  const sessionToken = request.cookies.get("x-operator-session")?.value;
  if (sessionToken) {
    const session = await validateSession(sessionToken);
    if (session) {
      const response = NextResponse.next();
      response.headers.set("x-request-id", requestId);
      return response;
    }
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
    { status: 401, headers: { "x-request-id": requestId } },
  );
}

// ---------------------------------------------------------------------------
// Matcher — only API routes; skip Next.js internals and static assets
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
