import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getDeletionStatus } from "@/lib/gdpr";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const { requestId } = await params;
    const deletionRequest = await getDeletionStatus(requestId);

    if (!deletionRequest) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Deletion request not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: deletionRequest, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch deletion status" }, meta: null },
      { status: 500, headers },
    );
  }
}
