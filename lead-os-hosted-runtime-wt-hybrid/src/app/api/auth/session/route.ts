import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { destroySession, validateSession } from "@/lib/auth-system";

export async function GET(request: Request) {
  const { context, response } = await requireAuth(request);
  if (response) return response;

  return NextResponse.json({
    data: {
      userId: context.userId,
      tenantId: context.tenantId,
      role: context.role,
      email: context.user.email,
      name: context.user.name,
    },
    error: null,
    meta: null,
  });
}

export async function DELETE(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cookieHeader = request.headers.get("cookie");

  let token: string | undefined;

  if (authHeader?.startsWith("Bearer sess_")) {
    token = authHeader.slice(7);
  } else {
    token = cookieHeader
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("leados_session="))
      ?.slice("leados_session=".length);
  }

  if (token) {
    const session = await validateSession(token);
    if (session) {
      await destroySession(token);
    }
  }

  const res = NextResponse.json({
    data: { message: "Logged out" },
    error: null,
    meta: null,
  });

  res.cookies.set({
    name: "leados_session",
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}
