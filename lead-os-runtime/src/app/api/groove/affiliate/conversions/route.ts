import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  recordConversion,
  getConversions,
  approveConversion,
  markConversionPaid,
} from "@/lib/integrations/groove-adapter";

const RecordConversionSchema = z.object({
  affiliateId: z.string().min(1),
  amount: z.number().positive(),
  orderId: z.string().optional(),
});

const UpdateConversionSchema = z.object({
  conversionId: z.string().min(1),
  action: z.enum(["approve", "pay"]),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const affiliateId = url.searchParams.get("affiliateId");
    const since = url.searchParams.get("since") ?? undefined;

    if (!affiliateId) {
      return NextResponse.json(
        { data: null, error: { code: "MISSING_PARAM", message: "affiliateId query param required" }, meta: null },
        { status: 400, headers },
      );
    }

    const conversions = await getConversions(affiliateId, since);

    return NextResponse.json(
      { data: conversions, error: null, meta: { count: conversions.length } },
      { headers },
    );
  } catch (err) {
    logger.error("groove/affiliate/conversions GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch conversions" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = RecordConversionSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const { affiliateId, amount, orderId } = validation.data;
    const conversion = await recordConversion(affiliateId, amount, orderId);

    return NextResponse.json(
      { data: conversion, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("groove/affiliate/conversions POST failed", { error: err instanceof Error ? err.message : String(err) });
    const message = err instanceof Error ? err.message : "Failed to record conversion";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: "RECORD_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}

export async function PATCH(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = UpdateConversionSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const { conversionId, action } = validation.data;
    const conversion =
      action === "approve"
        ? await approveConversion(conversionId)
        : await markConversionPaid(conversionId);

    return NextResponse.json(
      { data: conversion, error: null, meta: { action } },
      { status: 200, headers },
    );
  } catch (err) {
    logger.error("groove/affiliate/conversions PATCH failed", { error: err instanceof Error ? err.message : String(err) });
    const message = err instanceof Error ? err.message : "Failed to update conversion";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: "UPDATE_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}
