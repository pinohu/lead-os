import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getStoredVerification, shouldSendToEmail } from "@/lib/integrations/reoon-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ email: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  const { email } = await params;
  const decoded = decodeURIComponent(email);

  try {
    const result = await getStoredVerification(decoded);

    if (!result) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "NOT_FOUND", message: `No verification found for ${decoded}` },
          meta: null,
        },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      {
        data: { ...result, sendable: shouldSendToEmail(result) },
        error: null,
        meta: null,
      },
      { headers },
    );
  } catch (err) {
    console.error("[email-verify/email GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to retrieve verification" }, meta: null },
      { status: 500, headers },
    );
  }
}
