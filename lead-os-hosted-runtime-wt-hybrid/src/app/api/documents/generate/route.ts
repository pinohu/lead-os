import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import {
  generateDocument,
  generateProposal,
  generateInvoice,
} from "@/lib/integrations/doc-generator";

const GenerateDocSchema = z.object({
  tenantId: z.string().min(1),
  templateId: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  type: z.enum(["proposal", "invoice"]).optional(),
  leadData: z
    .object({
      name: z.string().min(1),
      company: z.string().optional(),
      niche: z.string().min(1),
      service: z.string().min(1),
      price: z.number().positive(),
      guarantee: z.string().optional(),
    })
    .optional(),
  invoiceData: z
    .object({
      clientName: z.string().min(1),
      items: z
        .array(
          z.object({
            description: z.string().min(1),
            amount: z.number().positive(),
          }),
        )
        .min(1),
      dueDate: z.string().min(1),
    })
    .optional(),
});

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const body = await request.json();
    const parsed = GenerateDocSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: parsed.error.issues.map((i) => ({
              field: i.path.join("."),
              issue: i.message,
            })),
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const { tenantId, type, templateId, data, leadData, invoiceData } = parsed.data;

    if (type === "proposal") {
      if (!leadData) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "leadData is required for proposal type" }, meta: null },
          { status: 400, headers },
        );
      }
      const doc = await generateProposal(tenantId, leadData);
      return NextResponse.json(
        { data: { document: doc }, error: null, meta: null },
        { status: 201, headers },
      );
    }

    if (type === "invoice") {
      if (!invoiceData) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "invoiceData is required for invoice type" }, meta: null },
          { status: 400, headers },
        );
      }
      const doc = await generateInvoice(tenantId, invoiceData);
      return NextResponse.json(
        { data: { document: doc }, error: null, meta: null },
        { status: 201, headers },
      );
    }

    if (!templateId || !data) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "templateId and data are required when type is not specified" }, meta: null },
        { status: 400, headers },
      );
    }

    const doc = await generateDocument(tenantId, templateId, data as Record<string, string>);
    return NextResponse.json(
      { data: { document: doc }, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate document";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: "DOC_GENERATION_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}
