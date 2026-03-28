import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { validateSafe } from "@/lib/canonical-schema";
import { redeployAssets } from "@/lib/auto-deploy";
import type { PageDefinition } from "@/lib/auto-deploy";

const RedeploySchema = z.object({
  pages: z.array(z.object({
    slug: z.string().min(1).max(100),
    title: z.string().min(1).max(200),
    description: z.string().max(500),
    type: z.enum(["landing-page", "seo-page", "form", "widget"]),
    headline: z.string().min(1).max(300),
    subheadline: z.string().max(500).optional(),
    ctaText: z.string().max(100).optional(),
    ctaUrl: z.string().max(500).optional(),
    formFields: z.array(z.object({
      name: z.string(),
      label: z.string(),
      type: z.string(),
      required: z.boolean(),
      placeholder: z.string().optional(),
    })).optional(),
    testimonials: z.array(z.object({
      quote: z.string(),
      name: z.string(),
      role: z.string().optional(),
    })).optional(),
    faqItems: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional(),
    primaryColor: z.string().max(20).optional(),
    ogImage: z.string().max(500).optional(),
    keywords: z.array(z.string()).optional(),
    schemaType: z.string().max(50).optional(),
  })).min(1).max(50),
});

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { jobId } = await params;

  try {
    const body = await request.json();
    const validation = validateSafe(RedeploySchema, body);
    if (!validation.valid) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Validation failed", details: validation.errors }, meta: null },
        { status: 422, headers },
      );
    }

    const job = await redeployAssets(jobId, validation.data!.pages as PageDefinition[]);
    if (!job) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Deployment not found: ${jobId}` }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: job, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { code: "REDEPLOY_FAILED", message: err instanceof Error ? err.message : "Redeployment failed" }, meta: null },
      { status: 500, headers },
    );
  }
}
