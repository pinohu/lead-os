import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import {
  getExperiment,
  analyzeExperiment,
  startExperiment,
  stopExperiment,
} from "@/lib/integrations/ab-testing";

const ActionSchema = z.object({
  action: z.enum(["start", "stop"]),
});

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { id } = await params;

  try {
    const experiment = await getExperiment(id);
    if (!experiment) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Experiment ${id} not found` }, meta: null },
        { status: 404, headers },
      );
    }

    let results = null;
    try {
      results = await analyzeExperiment(id);
    } catch {
      // Analysis is best-effort; return the experiment even without results
    }

    return NextResponse.json(
      { data: { experiment, results }, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch experiment" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { id } = await params;

  try {
    const raw = await request.json();
    const validation = ActionSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "action must be 'start' or 'stop'" }, meta: null },
        { status: 422, headers },
      );
    }

    const { action } = validation.data;
    const experiment = action === "start"
      ? await startExperiment(id)
      : await stopExperiment(id);

    return NextResponse.json(
      { data: experiment, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update experiment";
    const isNotFound = message.includes("not found");

    return NextResponse.json(
      { data: null, error: { code: isNotFound ? "NOT_FOUND" : "UPDATE_FAILED", message }, meta: null },
      { status: isNotFound ? 404 : 500, headers },
    );
  }
}
