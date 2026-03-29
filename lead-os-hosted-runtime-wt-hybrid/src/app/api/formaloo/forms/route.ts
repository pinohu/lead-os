import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { createForm, listForms } from "@/lib/integrations/formaloo-adapter";

const FieldSchema = z.object({
  slug: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  type: z.enum([
    "text", "email", "phone", "number", "select",
    "multi-select", "textarea", "date", "file", "rating", "nps",
  ]),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().max(200).optional(),
});

const CreateFormSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  fields: z.array(FieldSchema).min(1).max(50),
  tenantId: z.string().optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const forms = await listForms(tenantId);

    return NextResponse.json(
      { data: forms, error: null, meta: { count: forms.length } },
      { headers },
    );
  } catch (err) {
    console.error("[formaloo-forms]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list forms" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const raw = await request.json();
    const validation = CreateFormSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const form = await createForm(validation.data);

    return NextResponse.json(
      { data: form, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[formaloo-forms]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create form" }, meta: null },
      { status: 500, headers },
    );
  }
}
