import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  getDefaultTemplates,
  getTemplate,
  renderEmail,
  type EmailContext,
} from "@/lib/email-templates";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    getDefaultTemplates();
    const { id } = await params;
    const template = getTemplate(id);

    if (!template) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Template "${id}" not found` }, meta: null },
        { status: 404, headers },
      );
    }

    let context: Partial<EmailContext> = {};
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      if (body.context && typeof body.context === "object") {
        context = body.context as Partial<EmailContext>;
      }
    }

    const sampleContext: EmailContext = {
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      brandName: "Acme Growth",
      siteUrl: "https://example.com",
      supportEmail: "support@example.com",
      nicheName: "marketing agency",
      unsubscribeUrl: "https://example.com/unsubscribe?email=jane@example.com&tenant=demo",
      trackingPixelUrl: "https://example.com/api/tracking/pixel?eid=preview",
      currentYear: new Date().getFullYear().toString(),
      ...context,
    };

    const rendered = renderEmail(template, sampleContext);

    return new NextResponse(rendered.html, {
      status: 200,
      headers: {
        ...headers,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "PREVIEW_FAILED", message: "Failed to preview template" }, meta: null },
      { status: 500, headers },
    );
  }
}
