import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { predictConversion } from "@/lib/ai-predictive";
import { getLeadRecord, getLeadRecords } from "@/lib/runtime-store";

const MAX_LEAD_KEY_LENGTH = 128;

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

    const body = await request.json() as Record<string, unknown>;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Request body must be a JSON object" }, meta: null },
        { status: 400, headers },
      );
    }

    const leadKey = body.leadKey;
    if (typeof leadKey !== "string" || leadKey.trim().length === 0 || leadKey.length > MAX_LEAD_KEY_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "leadKey is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const lead = await getLeadRecord(leadKey);
    if (!lead) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Lead not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const historicalLeads = await getLeadRecords();
    const result = await predictConversion(leadKey, lead, historicalLeads);

    return NextResponse.json(
      {
        data: result,
        error: null,
        meta: { predictedAt: new Date().toISOString() },
      },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "PREDICTION_FAILED", message: err instanceof Error ? err.message : "Prediction failed" },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}
