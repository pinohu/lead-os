import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getStoredEnrichment } from "@/lib/integrations/databar-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lookupKey: string }> },
) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const { lookupKey } = await params;
  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  if (type !== "person" && type !== "company") {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_FAILED", message: "Query param type must be \"person\" or \"company\"" }, meta: null },
      { status: 400 },
    );
  }

  const stored = await getStoredEnrichment(decodeURIComponent(lookupKey), type);
  if (!stored) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: `No enrichment found for "${lookupKey}" (${type})` }, meta: null },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: stored, error: null, meta: null });
}
