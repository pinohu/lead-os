import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { fillContactForm, type ContactFormData } from "@/lib/integrations/skyvern-adapter";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (typeof body.formUrl !== "string" || body.formUrl.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "formUrl is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.data || typeof body.data !== "object") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "data object is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const formData = body.data as Record<string, unknown>;

    if (typeof formData.name !== "string" || formData.name.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "data.name is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (typeof formData.email !== "string" || formData.email.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "data.email is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (typeof formData.message !== "string" || formData.message.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "data.message is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const contactData: ContactFormData = {
      name: formData.name,
      email: formData.email,
      phone: typeof formData.phone === "string" ? formData.phone : undefined,
      company: typeof formData.company === "string" ? formData.company : undefined,
      message: formData.message,
    };

    const result = await fillContactForm(body.formUrl, contactData);
    return NextResponse.json(
      { data: result, error: null, meta: { formUrl: body.formUrl } },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FORM_SUBMISSION_FAILED", message: "Failed to submit form" }, meta: null },
      { status: 500, headers },
    );
  }
}
