// ── Admin auth gate for API routes ──────────────────────────────────
// Every /api/admin/* route repeats the same six-line boilerplate:
//
//   const session = await auth();
//   if (!session?.user || (session.user as { role?: string }).role !== "admin") {
//     return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//   }
//
// Copy-pasting that is a time bomb: one typo (`role !== "Admin"`, a
// missing `!session?.user` guard, wrong status code) silently exposes
// an admin route to any authenticated user. Centralize.
//
// Usage:
//
//   const unauthorized = await requireAdmin();
//   if (unauthorized) return unauthorized;
//
// The route body continues knowing the caller is a logged-in admin.
// The companion `requireAdminSession` returns the session object for
// routes that need `session.user.email` etc.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Session } from "next-auth";

// `Session["user"]` is `User | undefined` at the NextAuth type level,
// but our helper only returns `ok: true` when user is present. Narrow
// the returned session type so callers don't need `!` everywhere.
export type AuthenticatedSession = Session & { user: NonNullable<Session["user"]> };

export type AdminAuthResult =
  | { ok: true; session: AuthenticatedSession }
  | { ok: false; response: NextResponse };

function unauthorized(): NextResponse {
  // 403 would leak that admin routes exist to non-admins; return 401
  // for parity with pre-existing routes (and because NextAuth's login
  // redirect is tied to 401 semantics).
  return NextResponse.json(
    { success: false, error: "Unauthorized" },
    { status: 401 },
  );
}

/**
 * Re-verify the caller's admin role against the DB, not just the JWT.
 *
 * Background: NextAuth's jwt callback only stamps `role` into the
 * token on INITIAL login (`if (user)` branch). After that, the token
 * keeps the snapshot role until the session expires — default 30 days.
 * So demoting an admin in the DB (promote → provider, role revoked
 * by compromise response, whatever) would NOT invalidate their live
 * JWT's admin claim for up to a month.
 *
 * Re-reading the role from the user row on every admin request adds a
 * cheap single-column lookup to /api/admin/* (low-traffic by nature)
 * and closes the stale-token gap. If the DB read itself fails we
 * deny-by-default — better to temporarily 401 a legitimate admin than
 * let a stale claim through.
 */
async function verifyAdminRoleFresh(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  try {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return row?.role === "admin";
  } catch {
    return false;
  }
}

/**
 * Returns `null` when the caller is an authenticated admin, or a 401
 * NextResponse otherwise. Use at the top of every /api/admin/* handler.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const role = (session.user as { role?: string }).role;
  if (role !== "admin") return unauthorized();

  // Fresh DB check — JWT role claim may be stale after demotion.
  const stillAdmin = await verifyAdminRoleFresh(session.user.id);
  if (!stillAdmin) return unauthorized();

  return null;
}

/**
 * Like `requireAdmin` but returns the session when authorized, or a
 * NextResponse when not. Lets admin handlers use `result.session.user`
 * without repeating the auth() call.
 */
export async function requireAdminSession(): Promise<AdminAuthResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, response: unauthorized() };

  const role = (session.user as { role?: string }).role;
  if (role !== "admin") return { ok: false, response: unauthorized() };

  const stillAdmin = await verifyAdminRoleFresh(session.user.id);
  if (!stillAdmin) return { ok: false, response: unauthorized() };

  return { ok: true, session: session as AuthenticatedSession };
}
