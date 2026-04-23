import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { errorResponse } from "@/lib/api-response";
import { generatePreviewHtml, getPreviewSession } from "@/lib/widget-preview.ts";

export async function GET(request: Request) {
  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return errorResponse("VALIDATION_ERROR", "sessionId query parameter is required", 400);
  }

  const session = await getPreviewSession(sessionId);
  if (!session) {
    return errorResponse("NOT_FOUND", "Preview session not found or has expired", 404);
  }

  const html = generatePreviewHtml(session.config);

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Frame-Options": "SAMEORIGIN",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
