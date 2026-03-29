import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  createWidget,
  listWidgets,
} from "@/lib/integrations/novocall-adapter";

const CreateWidgetSchema = z.object({
  name: z.string().min(1),
  buttonText: z.string().min(1),
  buttonColor: z.string().min(1),
  position: z.enum(["bottom-right", "bottom-left"]),
  businessHours: z.array(z.object({
    day: z.string().min(1),
    start: z.string().min(1),
    end: z.string().min(1),
  })),
  greeting: z.string().min(1),
  fields: z.array(z.string().min(1)).min(1),
  tenantId: z.string().optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = CreateWidgetSchema.safeParse(raw);

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

    const widget = await createWidget(validation.data);
    return NextResponse.json(
      { data: widget, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[novocall/widgets POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create widget" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const widgets = await listWidgets(tenantId);
    return NextResponse.json(
      { data: widgets, error: null, meta: { count: widgets.length } },
      { headers },
    );
  } catch (err) {
    console.error("[novocall/widgets GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: "Failed to list widgets" }, meta: null },
      { status: 500, headers },
    );
  }
}
