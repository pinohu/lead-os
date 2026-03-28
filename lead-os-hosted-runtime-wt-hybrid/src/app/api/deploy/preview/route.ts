import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { validateSafe } from "@/lib/canonical-schema";
import { generateStaticSite } from "@/lib/auto-deploy";
import type { PageDefinition } from "@/lib/auto-deploy";

const PreviewSchema = z.object({
  tenantId: z.string().min(1).max(100),
  nicheSlug: z.string().min(1).max(100),
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

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { searchParams } = new URL(request.url);

  const tenantId = searchParams.get("tenantId");
  const nicheSlug = searchParams.get("nicheSlug");
  const pagesRaw = searchParams.get("pages");

  if (!tenantId || !nicheSlug || !pagesRaw) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId, nicheSlug, and pages query parameters are required" }, meta: null },
      { status: 400, headers },
    );
  }

  try {
    const parsed = JSON.parse(pagesRaw);
    const validation = validateSafe(PreviewSchema, { tenantId, nicheSlug, pages: parsed });
    if (!validation.valid) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Validation failed", details: validation.errors }, meta: null },
        { status: 422, headers },
      );
    }

    const files = generateStaticSite(tenantId, nicheSlug, validation.data!.pages as PageDefinition[]);
    return NextResponse.json(
      { data: files, error: null, meta: { fileCount: files.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "PREVIEW_FAILED", message: "Failed to generate preview. Ensure pages is valid JSON." }, meta: null },
      { status: 400, headers },
    );
  }
}
