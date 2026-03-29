import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  toggleAutomation,
  executeAutomation,
} from "@/lib/integrations/vbout-adapter";

const ToggleSchema = z.object({
  active: z.boolean(),
});

const ExecuteSchema = z.object({
  contactId: z.string().min(1),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const raw = await request.json();
    const validation = ToggleSchema.safeParse(raw);

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

    const automation = await toggleAutomation(id, validation.data.active);

    if (!automation) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Automation not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: automation, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[vbout/automations/[id] PATCH]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "UPDATE_FAILED", message: "Failed to toggle automation" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const raw = await request.json();
    const validation = ExecuteSchema.safeParse(raw);

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

    const result = await executeAutomation(id, validation.data.contactId);

    if (!result) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Automation or contact not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: result, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[vbout/automations/[id] POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "EXECUTE_FAILED", message: "Failed to execute automation" }, meta: null },
      { status: 500, headers },
    );
  }
}
