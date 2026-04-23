import { NextRequest, NextResponse } from "next/server";

const PUBLIC_EXACT = new Set([
  "/api/health",
  "/api/intake",
  "/api/decision",
]);

const PUBLIC_PREFIXES = [
  "/api/embed/",
  "/api/widgets/",
  "/api/automations/",
  "/api/auth/",
  "/api/cron/",
  "/api/config/health",
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return applySecurityHeaders(NextResponse.next());
  }

  if (isPublicRoute(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  const operatorCookie = request.cookies.get("leados_operator_session")?.value;
  const apiKey = request.headers.get("x-api-key");
  const authHeader = request.headers.get("authorization");

  if (operatorCookie || apiKey || authHeader?.startsWith("Bearer ")) {
    return applySecurityHeaders(NextResponse.next());
  }

  return NextResponse.json(
    { error: "Authentication required" },
    { status: 401 },
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
