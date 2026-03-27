import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  experimentStore,
  assignmentStore,
  selectVariant,
} from "@/lib/experiment-store";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

const MAX_EXPERIMENT_ID_LENGTH = 64;
const MAX_VISITOR_ID_LENGTH = 128;
// Alphanumeric + hyphens/underscores only to keep the compound map key safe.
const SAFE_VISITOR_ID_PATTERN = /^[\w-]{1,128}$/;

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

    const assignmentKey = `${id}:${visitorId}`;
    const existingAssignment = assignmentStore.get(assignmentKey);

    if (existingAssignment) {
      const variant = experiment.variants.find((v) => v.id === existingAssignment.variantId);
      return NextResponse.json(
        {
          data: {
            experimentId: id,
            visitorId,
            variantId: existingAssignment.variantId,
            variantName: variant?.name ?? existingAssignment.variantId,
            isNew: false,
          },
          error: null,
          meta: null,
        },
        { headers },
      );
    }

    const variantId = selectVariant(
      experiment.variants.map((v) => ({ id: v.id, weight: v.weight })),
    );

    const variant = experiment.variants.find((v) => v.id === variantId);
    if (variant) {
      variant.assignments += 1;
    }

    assignmentStore.set(assignmentKey, { experimentId: id, variantId });
    experiment.updatedAt = new Date().toISOString();
    experimentStore.set(id, experiment);

    return NextResponse.json(
      {
        data: {
          experimentId: id,
          visitorId,
          variantId,
          variantName: variant?.name ?? variantId,
          isNew: true,
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
        error: { code: "ASSIGN_FAILED", message: "Failed to assign variant" },
        meta: null,
      },
      { status: 400, headers },
    );
  }
}
