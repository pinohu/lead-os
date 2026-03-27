import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  experimentStore,
  assignmentStore,
  conversionStore,
} from "@/lib/experiment-store";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

const MAX_EXPERIMENT_ID_LENGTH = 64;
const MAX_VISITOR_ID_LENGTH = 128;
const MAX_METRIC_LENGTH = 100;
const SAFE_VISITOR_ID_PATTERN = /^[\w-]{1,128}$/;
const VALID_METRIC_PATTERN = /^[\w-]{1,100}$/;
// Conversion value cap prevents Infinity/NaN and implausibly large values
// from corrupting statistical analysis.
const MAX_CONVERSION_VALUE = 1_000_000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const { id } = await params;

    if (!id || id.length > MAX_EXPERIMENT_ID_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Experiment not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const experiment = experimentStore.get(id);

    if (!experiment) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Experiment not found" }, meta: null },
        { status: 404, headers },
      );
    }

    if (experiment.status !== "running") {
      return NextResponse.json(
        { data: null, error: { code: "NOT_RUNNING", message: "Experiment is not running" }, meta: null },
        { status: 409, headers },
      );
    }

    const body = await request.json();
    const visitorId = body.visitorId;

    if (!visitorId || typeof visitorId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "visitorId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (visitorId.length > MAX_VISITOR_ID_LENGTH || !SAFE_VISITOR_ID_PATTERN.test(visitorId)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "visitorId must contain only alphanumeric characters, underscores, or hyphens and be at most 128 characters" }, meta: null },
        { status: 400, headers },
      );
    }

    // Validate optional metric override — must match the same pattern as targetMetric.
    if (body.metric !== undefined && body.metric !== null) {
      if (typeof body.metric !== "string" || !VALID_METRIC_PATTERN.test(body.metric)) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "metric must contain only alphanumeric characters and hyphens" }, meta: null },
          { status: 400, headers },
        );
      }
      if (body.metric.length > MAX_METRIC_LENGTH) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: `metric must not exceed ${MAX_METRIC_LENGTH} characters` }, meta: null },
          { status: 400, headers },
        );
      }
    }

    // Validate optional conversion value — must be a finite, non-negative number.
    if (body.value !== undefined && body.value !== null) {
      if (
        typeof body.value !== "number" ||
        !isFinite(body.value) ||
        isNaN(body.value) ||
        body.value < 0 ||
        body.value > MAX_CONVERSION_VALUE
      ) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: `value must be a finite non-negative number no greater than ${MAX_CONVERSION_VALUE}` }, meta: null },
          { status: 400, headers },
        );
      }
    }

    const assignmentKey = `${id}:${visitorId}`;
    const assignment = assignmentStore.get(assignmentKey);

    if (!assignment) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_ASSIGNED", message: "Visitor has not been assigned to this experiment" }, meta: null },
        { status: 404, headers },
      );
    }

    const variant = experiment.variants.find((v) => v.id === assignment.variantId);
    if (variant) {
      variant.conversions += 1;
    }

    const conversion = {
      experimentId: id,
      visitorId,
      variantId: assignment.variantId,
      metric: (body.metric as string | undefined) ?? experiment.targetMetric,
      value: typeof body.value === "number" ? body.value : 1,
      timestamp: new Date().toISOString(),
    };

    conversionStore.push(conversion);
    experiment.updatedAt = new Date().toISOString();
    experimentStore.set(id, experiment);

    return NextResponse.json(
      {
        data: {
          experimentId: id,
          visitorId,
          variantId: assignment.variantId,
          variantName: variant?.name ?? assignment.variantId,
          metric: conversion.metric,
          value: conversion.value,
          recorded: true,
        },
        error: null,
        meta: null,
      },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { code: "CONVERT_FAILED", message: "Failed to record conversion" },
        meta: null,
      },
      { status: 400, headers },
    );
  }
}
