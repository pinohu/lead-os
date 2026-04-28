import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { createApiKey, getUserById, listApiKeys } from "@/lib/auth-system";

export async function GET(request: Request) {
  const { context, response } = await requireAuth(request);
  if (response) return response;

  const user = await getUserById(context.userId);
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "User not found" }, meta: null },
      { status: 404 },
    );
  }

  const keys = (await listApiKeys(context.userId)).map((k) => ({
    id: k.id,
    name: k.name,
    prefix: k.prefix,
    permissions: k.permissions,
    lastUsedAt: k.lastUsedAt ?? null,
    expiresAt: k.expiresAt ?? null,
    createdAt: k.createdAt,
  }));

  return NextResponse.json({ data: keys, error: null, meta: null });
}

export async function POST(request: Request) {
  const { context, response } = await requireAuth(request, "write:settings");
  if (response) return response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "Key name is required" }, meta: null },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.permissions) || body.permissions.length === 0) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "At least one permission is required" }, meta: null },
      { status: 400 },
    );
  }

  const result = await createApiKey(
    context.userId,
    body.name.trim(),
    body.permissions,
    body.expiresAt,
  );

  if (!result) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "User not found" }, meta: null },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      data: {
        id: result.record.id,
        name: result.record.name,
        prefix: result.record.prefix,
        permissions: result.record.permissions,
        rawKey: result.rawKey,
        createdAt: result.record.createdAt,
      },
      error: null,
      meta: { warning: "Store this key securely. It will not be shown again." },
    },
    { status: 201 },
  );
}
