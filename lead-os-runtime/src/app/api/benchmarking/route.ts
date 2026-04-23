import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  computeNicheBenchmark,
  getNicheBenchmark,
  recordTenantSnapshot,
  type TenantMetricsSnapshot,
} from "@/lib/niche-benchmarking";

export async function GET(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const niche = searchParams.get("niche");
  const period = searchParams.get("period") ?? undefined;

  if (!niche || !niche.trim()) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_FAILED",
          message: "niche query parameter is required",
          details: [{ field: "niche", issue: "Must be a non-empty string" }],
        },
        meta: null,
      },
      { status: 400 },
    );
  }

  const benchmark = await getNicheBenchmark(niche.trim(), period);

  if (!benchmark) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "NOT_FOUND",
          message: `No benchmarking data found for niche "${niche}"`,
          details: [],
        },
        meta: null,
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: benchmark,
    error: null,
    meta: {
      niche: benchmark.niche,
      period: benchmark.period,
      tenantCount: benchmark.tenantCount,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { code: "INVALID_JSON", message: "Request body must be valid JSON", details: [] },
        meta: null,
      },
      { status: 400 },
    );
  }

  const input = body as Partial<TenantMetricsSnapshot>;

  if (typeof input.tenantId !== "string" || !input.tenantId.trim()) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_FAILED",
          message: "tenantId is required",
          details: [{ field: "tenantId", issue: "Must be a non-empty string" }],
        },
        meta: null,
      },
      { status: 400 },
    );
  }

  if (typeof input.niche !== "string" || !input.niche.trim()) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_FAILED",
          message: "niche is required",
          details: [{ field: "niche", issue: "Must be a non-empty string" }],
        },
        meta: null,
      },
      { status: 400 },
    );
  }

  if (typeof input.period !== "string" || !/^\d{4}-\d{2}$/.test(input.period)) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_FAILED",
          message: "period must be in YYYY-MM format",
          details: [{ field: "period", issue: "Must match YYYY-MM format" }],
        },
        meta: null,
      },
      { status: 400 },
    );
  }

  const numericFields: Array<keyof TenantMetricsSnapshot> = [
    "leadsCapured",
    "leadsConverted",
    "conversionRate",
    "avgLeadScore",
    "avgResponseTimeMinutes",
    "activeExperiments",
    "emailOpenRate",
    "emailClickRate",
    "revenuePerLead",
  ];

  for (const field of numericFields) {
    if (typeof input[field] !== "number") {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_FAILED",
            message: `${field} is required and must be a number`,
            details: [{ field, issue: "Must be a number" }],
          },
          meta: null,
        },
        { status: 400 },
      );
    }
  }

  const snapshot: TenantMetricsSnapshot = {
    tenantId: input.tenantId.trim(),
    niche: input.niche.trim(),
    period: input.period,
    leadsCapured: input.leadsCapured as number,
    leadsConverted: input.leadsConverted as number,
    conversionRate: input.conversionRate as number,
    avgLeadScore: input.avgLeadScore as number,
    avgResponseTimeMinutes: input.avgResponseTimeMinutes as number,
    activeExperiments: input.activeExperiments as number,
    emailOpenRate: input.emailOpenRate as number,
    emailClickRate: input.emailClickRate as number,
    revenuePerLead: input.revenuePerLead as number,
    snapshotAt: typeof input.snapshotAt === "string" ? input.snapshotAt : new Date().toISOString(),
  };

  const saved = await recordTenantSnapshot(snapshot);

  // Recompute the benchmark after recording a new snapshot so the cache stays fresh.
  const benchmark = await computeNicheBenchmark(snapshot.niche, snapshot.period);

  return NextResponse.json(
    {
      data: saved,
      error: null,
      meta: {
        benchmarkTenantCount: benchmark.tenantCount,
      },
    },
    { status: 201 },
  );
}
