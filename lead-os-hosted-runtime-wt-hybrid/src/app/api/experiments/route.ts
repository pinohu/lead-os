import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  experimentStore,
  generateExperimentId,
  type Experiment,
} from "@/lib/experiment-store";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    let experiments = [...experimentStore.values()];
    if (status) {
      experiments = experiments.filter((e) => e.status === status);
    }

    experiments.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json(
      {
        data: experiments,
        error: null,
        meta: { count: experiments.length },
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { code: "LIST_FAILED", message: "Failed to list experiments" },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

// Field length limits prevent memory exhaustion from unbounded user input.
const MAX_EXPERIMENT_NAME_LENGTH = 200;
const MAX_EXPERIMENT_DESCRIPTION_LENGTH = 1000;
const MAX_TARGET_METRIC_LENGTH = 100;
const MAX_VARIANT_NAME_LENGTH = 100;
const MAX_VARIANT_ID_LENGTH = 64;
const MAX_VARIANTS_COUNT = 20;
// Alphanumeric + limited punctuation for variant IDs stored as map keys.
const SAFE_VARIANT_ID_PATTERN = /^[\w-]{1,64}$/;
const VALID_TARGET_METRIC_PATTERN = /^[\w-]{1,100}$/;

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

    const body = await request.json();

    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "name is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.name.length > MAX_EXPERIMENT_NAME_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `name must not exceed ${MAX_EXPERIMENT_NAME_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.description !== undefined && body.description !== null) {
      if (typeof body.description !== "string") {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "description must be a string" }, meta: null },
          { status: 400, headers },
        );
      }
      if (body.description.length > MAX_EXPERIMENT_DESCRIPTION_LENGTH) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: `description must not exceed ${MAX_EXPERIMENT_DESCRIPTION_LENGTH} characters` }, meta: null },
          { status: 400, headers },
        );
      }
    }

    if (body.targetMetric !== undefined && body.targetMetric !== null) {
      if (typeof body.targetMetric !== "string" || !VALID_TARGET_METRIC_PATTERN.test(body.targetMetric)) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "targetMetric must contain only alphanumeric characters and hyphens" }, meta: null },
          { status: 400, headers },
        );
      }
    }

    if (!body.variants || !Array.isArray(body.variants) || body.variants.length < 2) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "At least 2 variants are required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.variants.length > MAX_VARIANTS_COUNT) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `No more than ${MAX_VARIANTS_COUNT} variants are allowed` }, meta: null },
        { status: 400, headers },
      );
    }

    for (const variant of body.variants) {
      if (!variant.name || typeof variant.name !== "string" || variant.name.trim().length === 0) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "Each variant must have a name" }, meta: null },
          { status: 400, headers },
        );
      }
      if (variant.name.length > MAX_VARIANT_NAME_LENGTH) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: `Variant name must not exceed ${MAX_VARIANT_NAME_LENGTH} characters` }, meta: null },
          { status: 400, headers },
        );
      }
      if (variant.id !== undefined && variant.id !== null) {
        if (typeof variant.id !== "string" || !SAFE_VARIANT_ID_PATTERN.test(variant.id)) {
          return NextResponse.json(
            { data: null, error: { code: "VALIDATION_ERROR", message: "Variant id must contain only alphanumeric characters, underscores, or hyphens" }, meta: null },
            { status: 400, headers },
          );
        }
        if (variant.id.length > MAX_VARIANT_ID_LENGTH) {
          return NextResponse.json(
            { data: null, error: { code: "VALIDATION_ERROR", message: `Variant id must not exceed ${MAX_VARIANT_ID_LENGTH} characters` }, meta: null },
            { status: 400, headers },
          );
        }
      }
      if (variant.weight !== undefined && variant.weight !== null) {
        if (typeof variant.weight !== "number" || !isFinite(variant.weight) || variant.weight < 0) {
          return NextResponse.json(
            { data: null, error: { code: "VALIDATION_ERROR", message: "Variant weight must be a non-negative finite number" }, meta: null },
            { status: 400, headers },
          );
        }
      }
    }

    const totalWeight = body.variants.reduce(
      (sum: number, v: { weight?: number }) => sum + (v.weight ?? 1),
      0,
    );

    if (totalWeight <= 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Sum of variant weights must be greater than zero" }, meta: null },
        { status: 400, headers },
      );
    }

    const now = new Date().toISOString();
    const experiment: Experiment = {
      id: generateExperimentId(),
      name: body.name.trim(),
      description: (body.description as string | undefined)?.trim() ?? "",
      status: body.status === "running" ? "running" : "draft",
      variants: body.variants.map((v: { id?: string; name: string; weight?: number }, i: number) => ({
        id: v.id ?? `var_${i}`,
        name: v.name.trim(),
        weight: (v.weight ?? 1) / totalWeight,
        assignments: 0,
        conversions: 0,
      })),
      targetMetric: body.targetMetric ?? "conversion",
      startedAt: body.status === "running" ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };

    experimentStore.set(experiment.id, experiment);

    return NextResponse.json(
      { data: experiment, error: null, meta: null },
      { status: 201, headers },
    );
  } catch {
    // Do not forward the raw exception message — it can contain JSON parse
    // errors with fragments of the request body.
    return NextResponse.json(
      {
        data: null,
        error: { code: "CREATE_FAILED", message: "Failed to create experiment" },
        meta: null,
      },
      { status: 400, headers },
    );
  }
}
