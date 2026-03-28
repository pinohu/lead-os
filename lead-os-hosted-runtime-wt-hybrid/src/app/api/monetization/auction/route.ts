import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { auctionLead } from "@/lib/monetization-engine";
import { z } from "zod";

const AuctionSchema = z.object({
  leadId: z.string().min(1).max(200),
  niche: z.string().max(200).optional(),
  reservePrice: z.number().min(0).optional(),
  buyers: z.array(z.object({
    buyerId: z.string().min(1).max(200),
    bidAmount: z.number().min(0),
  })).min(1).max(100),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const raw = await request.json();

    const validation = AuctionSchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: {} },
        { status: 422, headers },
      );
    }
    const body = validation.data;

    const result = auctionLead(
      { id: body.leadId, niche: body.niche ?? "general", reservePrice: body.reservePrice ?? 0 },
      body.buyers,
    );

    return NextResponse.json(
      { data: result, error: null, meta: null },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: "Failed to auction lead" }, meta: null },
      { status: 500, headers },
    );
  }
}
