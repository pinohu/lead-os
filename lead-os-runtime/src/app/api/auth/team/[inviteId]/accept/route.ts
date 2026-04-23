import { NextResponse } from "next/server";
import { acceptInvite } from "@/lib/auth-system";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ inviteId: string }> },
) {
  const { inviteId } = await params;

  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "Name is required" }, meta: null },
      { status: 400 },
    );
  }

  const user = await acceptInvite(inviteId, body.name.trim());
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Invite not found, already accepted, or expired" }, meta: null },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        role: user.role,
      },
      error: null,
      meta: null,
    },
    { status: 201 },
  );
}
