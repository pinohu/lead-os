import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { validateSafe } from "@/lib/canonical-schema";
import { createWidget, listWidgets } from "@/lib/integrations/embed-widgets-adapter";

export const dynamic = "force-dynamic";

const WidgetStylingSchema = z.object({
  primaryColor: z.string().min(1).max(50),
  fontFamily: z.string().min(1).max(100),
  borderRadius: z.string().min(1).max(20),
  position: z.enum(["bottom-right", "bottom-left", "center", "top-bar"]),
  size: z.enum(["small", "medium", "large"]),
});

const WidgetBehaviorSchema = z.object({
  trigger: z.enum(["immediate", "scroll", "exit-intent", "delay", "click"]),
  delay: z.number().optional(),
  scrollPercent: z.number().min(0).max(100).optional(),
  showOnMobile: z.boolean(),
  frequency: z.enum(["always", "once", "session"]),
});

const CreateWidgetSchema = z.object({
  tenantId: z.string().min(1).max(100),
  type: z.enum(["chat", "form", "booking", "popup", "banner", "floating-cta"]),
  name: z.string().min(1).max(200),
  styling: WidgetStylingSchema,
  behavior: WidgetBehaviorSchema,
  fields: z.array(z.object({
    name: z.string().min(1),
    label: z.string().min(1),
    type: z.enum(["text", "email", "phone", "textarea", "select", "checkbox"]),
    required: z.boolean(),
    placeholder: z.string().optional(),
    options: z.array(z.string()).optional(),
  })).optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
      { status: 400, headers },
    );
  }

  const widgets = await listWidgets(tenantId);
  return NextResponse.json(
    { data: widgets, error: null, meta: { total: widgets.length } },
    { headers },
  );
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = await request.json();
    const validation = validateSafe(CreateWidgetSchema, body);
    if (!validation.valid) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Validation failed", details: validation.errors }, meta: null },
        { status: 422, headers },
      );
    }

    const { tenantId, type, name, styling, behavior, fields } = validation.data!;
    const widget = await createWidget(tenantId, { type, name, styling, behavior, fields });

    return NextResponse.json(
      { data: widget, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: err instanceof Error ? err.message : "Widget creation failed" }, meta: null },
      { status: 500, headers },
    );
  }
}
