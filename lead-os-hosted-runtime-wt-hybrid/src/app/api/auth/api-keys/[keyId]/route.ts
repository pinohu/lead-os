import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { revokeApiKey, getUserById } from "@/lib/auth-system";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ keyId: string }> },
) {
  const { context, response } = await requireAuth(request, "write:settings");
  if (response) return response;

  const { keyId } = await params;

  const user = await getUserById(context.userId);
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "User not found" }, meta: null },
      { status: 404 },
    );
  }

  const revoked = await revokeApiKey(keyId, context.userId);
  if (!revoked) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "API key not found" }, meta: null },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: { message: "API key revoked" },
    error: null,
    meta: null,
  });
}
