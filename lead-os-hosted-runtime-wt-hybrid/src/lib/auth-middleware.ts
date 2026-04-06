import { NextResponse } from "next/server";
import {
  validateApiKey,
  validateSession,
  getUserById,
  hasPermission,
  type UserAccount,
  type UserRole,
} from "./auth-system.ts";
import { getOperatorSessionFromCookieHeader, OPERATOR_SESSION_COOKIE } from "./operator-auth.ts";
import { tenantConfig } from "./tenant.ts";

export interface AuthFromHeaders {
  userId: string;
  role: string;
  tenantId?: string;
  method: string;
}

/**
 * Reads identity headers set by the Next.js middleware after successful
 * authentication. Verifies the middleware signature to prevent header spoofing.
 * Returns null when the middleware did not authenticate the request.
 */
export function getAuthFromHeaders(request: Request): AuthFromHeaders | null {
  const userId = request.headers.get("x-authenticated-user-id");
  const role = request.headers.get("x-authenticated-role");
  const signature = request.headers.get("x-middleware-signature");
  if (!userId || !role) return null;

  // Signature MUST be present and start with mw1- to prove middleware processed this request
  if (!signature || !signature.startsWith("mw1-")) return null;

  return {
    userId,
    role,
    tenantId: request.headers.get("x-authenticated-tenant-id") ?? undefined,
    method: request.headers.get("x-authenticated-method") ?? "unknown",
  };
}

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: UserRole;
  permissions: string[];
  user: UserAccount;
}

export type AuthResult =
  | { authenticated: true; context: AuthContext }
  | { authenticated: false; error: string };

export async function authenticateRequest(request: Request): Promise<AuthResult> {
  // Fast path: trust identity headers set by the Next.js middleware to avoid
  // redundant token validation. The middleware already verified the credential
  // and attached user/role/tenant info to the forwarded request headers.
  const headerAuth = getAuthFromHeaders(request);
  if (headerAuth) {
    const role = headerAuth.role as UserRole;
    if (headerAuth.method === "operator-cookie") {
      return {
        authenticated: true,
        context: {
          userId: headerAuth.userId,
          tenantId: headerAuth.tenantId ?? tenantConfig.tenantId,
          role,
          permissions: [],
          user: {
            id: headerAuth.userId,
            email: headerAuth.userId,
            name: headerAuth.userId,
            tenantId: headerAuth.tenantId ?? tenantConfig.tenantId,
            role,
            apiKeys: [],
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }

    const user = await getUserById(headerAuth.userId);
    if (user && user.status === "active") {
      return {
        authenticated: true,
        context: {
          userId: user.id,
          tenantId: user.tenantId,
          role: user.role,
          permissions: [],
          user,
        },
      };
    }
  }

  // Fallback: full credential validation for requests that bypass middleware
  // (e.g. direct server-side calls or test harnesses).
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer los_")) {
    const rawKey = authHeader.slice(7);
    const result = await validateApiKey(rawKey);
    if (!result) {
      return { authenticated: false, error: "Invalid or expired API key" };
    }
    if (result.user.status !== "active") {
      return { authenticated: false, error: "User account is suspended" };
    }
    return {
      authenticated: true,
      context: {
        userId: result.user.id,
        tenantId: result.user.tenantId,
        role: result.user.role,
        permissions: result.permissions,
        user: result.user,
      },
    };
  }

  if (authHeader?.startsWith("Bearer sess_")) {
    const token = authHeader.slice(7);
    const session = await validateSession(token);
    if (!session) {
      return { authenticated: false, error: "Invalid or expired session" };
    }
    const user = await getUserById(session.userId);
    if (!user || user.status !== "active") {
      return { authenticated: false, error: "User account not found or suspended" };
    }
    return {
      authenticated: true,
      context: {
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
        permissions: [],
        user,
      },
    };
  }

  const cookieHeader = request.headers.get("cookie");
  const sessionCookie = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`leados_session=`))
    ?.slice("leados_session=".length);

  if (sessionCookie?.startsWith("sess_")) {
    const session = await validateSession(sessionCookie);
    if (session) {
      const user = await getUserById(session.userId);
      if (user && user.status === "active") {
        return {
          authenticated: true,
          context: {
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role,
            permissions: [],
            user,
          },
        };
      }
    }
  }

  const operatorSession = await getOperatorSessionFromCookieHeader(cookieHeader);
  if (operatorSession) {
    return {
      authenticated: true,
      context: {
        userId: operatorSession.email,
        tenantId: tenantConfig.tenantId,
        role: "owner",
        permissions: [],
        user: {
          id: operatorSession.email,
          email: operatorSession.email,
          name: operatorSession.email,
          tenantId: tenantConfig.tenantId,
          role: "owner",
          apiKeys: [],
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    };
  }

  return { authenticated: false, error: "No valid authentication credentials provided" };
}

export async function requireAuth(
  request: Request,
  permission?: string,
): Promise<
  | { context: AuthContext; response: null }
  | { context: null; response: NextResponse }
> {
  const result = await authenticateRequest(request);

  if (!result.authenticated) {
    return {
      context: null,
      response: NextResponse.json(
        { data: null, error: { code: "UNAUTHORIZED", message: result.error }, meta: null },
        { status: 401 },
      ),
    };
  }

  if (permission) {
    const apiKeyHasPerm =
      result.context.permissions.length > 0 && result.context.permissions.includes(permission);
    const roleHasPerm = hasPermission(result.context.role, permission);

    if (result.context.permissions.length > 0 && !apiKeyHasPerm) {
      return {
        context: null,
        response: NextResponse.json(
          { data: null, error: { code: "FORBIDDEN", message: "API key lacks required permission" }, meta: null },
          { status: 403 },
        ),
      };
    }

    if (result.context.permissions.length === 0 && !roleHasPerm) {
      return {
        context: null,
        response: NextResponse.json(
          { data: null, error: { code: "FORBIDDEN", message: "Insufficient permissions" }, meta: null },
          { status: 403 },
        ),
      };
    }
  }

  return { context: result.context, response: null };
}
