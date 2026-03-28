import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { createExperiment, listExperiments } from "@/lib/integrations/ab-testing";

const VariationSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1).max(200),
  weight: z.number().min(0).max(1),
});

const TargetingRuleSchema = z.object({
  attribute: z.string().min(1),
  condition: z.enum(["equals", "not_equals", "contains"]),
  value: z.string(),
});

const CreateExperimentSchema = z.object({
  name: z.string().min(1).max(200),
  hypothesis: z.string().min(1).max(2000),
  variations: z.array(VariationSchema).min(2).max(20),
  targetingRules: z.array(TargetingRuleSchema).optional(),
  metrics: z.array(z.string().min(1)).min(1).max(20),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? undefined;

    const experiments = await listExperiments(status);

    return NextResponse.json(
      { data: experiments, error: null, meta: { count: experiments.length } },
      { headers },
    );
  } catch (err) {
    console.error("[ab-test]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list experiments" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const raw = await request.json();
    const validation = CreateExperimentSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const experiment = await createExperiment({
      name: validation.data.name,
      hypothesis: validation.data.hypothesis,
      variations: validation.data.variations.map((v) => ({
        id: v.id ?? crypto.randomUUID(),
        name: v.name,
        weight: v.weight,
      })),
      targetingRules: validation.data.targetingRules,
      metrics: validation.data.metrics,
    });

    return NextResponse.json(
      { data: experiment, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[ab-test]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create experiment" }, meta: null },
      { status: 500, headers },
    );
  }
}
