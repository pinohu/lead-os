import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  getNumber,
  pauseNumber,
  resumeNumber,
  releaseNumber,
} from "@/lib/integrations/callscaler-adapter";

const PatchSchema = z.object({
  action: z.enum(["pause", "resume", "release"]),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const number = await getNumber(id);

    if (!number) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Tracking number ${id} not found` }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: number, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[callscaler/numbers/[id] GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch tracking number" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const raw = await request.json();
    const validation = PatchSchema.safeParse(raw);

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

    const { action } = validation.data;
    let number;

    if (action === "pause") {
      number = await pauseNumber(id);
    } else if (action === "resume") {
      number = await resumeNumber(id);
    } else {
      number = await releaseNumber(id);
    }

    return NextResponse.json(
      { data: number, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update tracking number";
    const status = message.includes("not found") ? 404 : 400;
    console.error("[callscaler/numbers/[id] PATCH]", message);
    return NextResponse.json(
      { data: null, error: { code: "UPDATE_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}
