import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { deleteAsset, getAsset } from "@/lib/asset-manager";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const asset = getAsset(id);

    if (!asset) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Asset "${id}" not found` }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json({ data: asset, error: null, meta: null }, { headers });
  } catch (err) {
    logger.error("assets-id failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch asset" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const deleted = deleteAsset(id);

    if (!deleted) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Asset "${id}" not found` }, meta: null },
        { status: 404, headers },
      );
    }

    return new NextResponse(null, { status: 204, headers });
  } catch (err) {
    logger.error("assets-id failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "DELETE_FAILED", message: "Failed to delete asset" }, meta: null },
      { status: 500, headers },
    );
  }
}
