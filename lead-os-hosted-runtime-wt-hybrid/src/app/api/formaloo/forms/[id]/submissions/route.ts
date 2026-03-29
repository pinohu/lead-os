import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { submitForm, listSubmissions } from "@/lib/integrations/formaloo-adapter";

const SubmitSchema = z.record(z.string(), z.union([z.string(), z.number()]));

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { id } = await params;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const submissions = await listSubmissions(id, tenantId);

    return NextResponse.json(
      { data: submissions, error: null, meta: { count: submissions.length } },
      { headers },
    );
  } catch (err) {
    console.error("[formaloo-submissions]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list submissions" }, meta: null },
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
    const validation = SubmitSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid submission data", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const submission = await submitForm(id, validation.data);

    return NextResponse.json(
      { data: submission, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit form";
    const isNotFound = message.includes("not found");
    const isNotAccepting = message.includes("not accepting");

    return NextResponse.json(
      {
        data: null,
        error: {
          code: isNotFound ? "NOT_FOUND" : isNotAccepting ? "FORM_INACTIVE" : "SUBMIT_FAILED",
          message,
        },
        meta: null,
      },
      { status: isNotFound ? 404 : isNotAccepting ? 422 : 500, headers },
    );
  }
}
