import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { experimentStore, analyzeExperiment } from "@/lib/experiment-store";

const MAX_EXPERIMENT_ID_LENGTH = 64;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const { id } = await params;

    // Validate the route parameter before using it as a Map key to prevent
    // excessively long or malformed strings from reaching the store.
    if (!id || id.length > MAX_EXPERIMENT_ID_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Experiment not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const experiment = experimentStore.get(id);

    if (!experiment) {
      return NextResponse.json(
        // Do not reflect the raw id back — use a generic message to avoid
        // probing for valid experiment IDs via error messages.
        { data: null, error: { code: "NOT_FOUND", message: "Experiment not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const analysis = analyzeExperiment(experiment);

    return NextResponse.json(
      { data: { ...experiment, analysis }, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { code: "FETCH_FAILED", message: "Failed to fetch experiment" },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

const MAX_PATCH_NAME_LENGTH = 200;
const MAX_PATCH_DESCRIPTION_LENGTH = 1000;

export async function PATCH(
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

    const body = await request.json();
    const now = new Date().toISOString();
    const validStatuses = ["draft", "running", "paused", "completed"];

    if (body.status !== undefined && body.status !== null) {
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: `status must be one of: ${validStatuses.join(", ")}` }, meta: null },
          { status: 400, headers },
        );
      }

      experiment.status = body.status;

      if (body.status === "running" && !experiment.startedAt) {
        experiment.startedAt = now;
      }
      if (body.status === "completed") {
        experiment.completedAt = now;
      }
    }

    if (body.name !== undefined && body.name !== null) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "name must be a non-empty string" }, meta: null },
          { status: 400, headers },
        );
      }
      if (body.name.length > MAX_PATCH_NAME_LENGTH) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: `name must not exceed ${MAX_PATCH_NAME_LENGTH} characters` }, meta: null },
          { status: 400, headers },
        );
      }
      experiment.name = body.name.trim();
    }

    if (body.description !== undefined && body.description !== null) {
      if (typeof body.description !== "string") {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "description must be a string" }, meta: null },
          { status: 400, headers },
        );
      }
      if (body.description.length > MAX_PATCH_DESCRIPTION_LENGTH) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: `description must not exceed ${MAX_PATCH_DESCRIPTION_LENGTH} characters` }, meta: null },
          { status: 400, headers },
        );
      }
      experiment.description = body.description.trim();
    }

    experiment.updatedAt = now;
    experimentStore.set(id, experiment);

    return NextResponse.json(
      { data: experiment, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { code: "UPDATE_FAILED", message: "Failed to update experiment" },
        meta: null,
      },
      { status: 400, headers },
    );
  }
}
