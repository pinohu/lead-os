import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getPost, deletePost, getPostPerformance } from "@/lib/integrations/vista-social-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const post = await getPost(id);

    if (!post) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Post not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const performance = await getPostPerformance(id);

    return NextResponse.json(
      { data: { ...post, performance }, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("[vista-social/posts/[id] GET]", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to get post" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const deleted = await deletePost(id);

    if (!deleted) {
      return NextResponse.json(
        { data: null, error: { code: "DELETE_FAILED", message: "Post not found or cannot be deleted" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: { id, deleted: true }, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("[vista-social/posts/[id] DELETE]", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "DELETE_FAILED", message: "Failed to delete post" }, meta: null },
      { status: 500, headers },
    );
  }
}
