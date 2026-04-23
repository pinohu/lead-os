import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { getForm, updateForm } from "@/lib/integrations/formaloo-adapter";

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

const UpdateFormSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  fields: z.array(FieldSchema).min(1).max(50).optional(),
  status: z.enum(["active", "paused", "archived"]).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { id } = await params;

  try {
    const form = await getForm(id);
    if (!form) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Form ${id} not found` }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: form, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("formaloo-form-id failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch form" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { id } = await params;

  try {
    const raw = await request.json();
    const validation = UpdateFormSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const updated = await updateForm(id, validation.data);

    return NextResponse.json(
      { data: updated, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update form";
    const isNotFound = message.includes("not found");

    return NextResponse.json(
      { data: null, error: { code: isNotFound ? "NOT_FOUND" : "UPDATE_FAILED", message }, meta: null },
      { status: isNotFound ? 404 : 500, headers },
    );
  }
}
