import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { claimLeadForBuyer } from "@/lib/marketplace";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.buyerId || typeof body.buyerId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "buyerId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const result = await claimLeadForBuyer(id, body.buyerId);

    return NextResponse.json({
      data: {
        lead: result.lead,
        revealedContact: result.revealedContact,
      },
      error: null,
      meta: null,
    }, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to claim lead";
    const isClientError = message.includes("not found") ||
      message.includes("not available") ||
      message.includes("suspended") ||
      message.includes("budget");
    return NextResponse.json(
      { data: null, error: { code: isClientError ? "CLAIM_FAILED" : "INTERNAL_ERROR", message }, meta: null },
      { status: isClientError ? 400 : 500, headers },
    );
  }
}
