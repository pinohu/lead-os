import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { listUsers, createTeamInvite, listInvites } from "@/lib/auth-system";

export async function GET(request: Request) {
  const { context, response } = await requireAuth(request, "read:team");
  if (response) return response;

  const [members, invites] = await Promise.all([
    listUsers(context.tenantId),
    listInvites(context.tenantId),
  ]);

  const memberData = members.map((m) => ({
    id: m.id,
    email: m.email,
    name: m.name,
    role: m.role,
    status: m.status,
    lastLoginAt: m.lastLoginAt ?? null,
    createdAt: m.createdAt,
  }));

  const pendingInvites = invites
    .filter((i) => i.status === "pending")
    .map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      invitedBy: i.invitedBy,
      expiresAt: i.expiresAt,
      createdAt: i.createdAt,
    }));

  return NextResponse.json({
    data: { members: memberData, invites: pendingInvites },
    error: null,
    meta: null,
  });
}

export async function POST(request: Request) {
  const { context, response } = await requireAuth(request, "write:team");
  if (response) return response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body.email !== "string" || !body.email.trim()) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "Email is required" }, meta: null },
      { status: 400 },
    );
  }

  const validRoles = ["admin", "operator", "viewer", "billing-admin"] as const;
  if (!body.role || !validRoles.includes(body.role)) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: `Role must be one of: ${validRoles.join(", ")}` }, meta: null },
      { status: 400 },
    );
  }

  const invite = await createTeamInvite(
    body.email.trim(),
    context.tenantId,
    body.role,
    context.userId,
  );

  return NextResponse.json(
    {
      data: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
      error: null,
      meta: null,
    },
    { status: 201 },
  );
}
