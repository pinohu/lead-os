import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { createRateLimiter } from "@/lib/rate-limiter";
import { validateSafe } from "@/lib/canonical-schema";
import { createDeployment, listDeployments } from "@/lib/auto-deploy";
import type { DeploymentTarget, DeploymentPlatform, PageDefinition } from "@/lib/auto-deploy";
import { getClientIp } from "@/lib/request-utils";

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });

const PageDefinitionSchema = z.object({
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
});

const CreateDeploymentSchema = z.object({
  tenantId: z.string().min(1).max(100),
  nicheSlug: z.string().min(1).max(100),
  pages: z.array(PageDefinitionSchema).min(1).max(50),
  platform: z.enum(["vercel", "cloudflare", "github-pages"]).default("vercel"),
  target: z.object({
    type: z.enum(["github-pages", "vercel", "cloudflare-pages", "static-export"]),
    config: z.record(z.string(), z.string()).optional(),
  }).optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const ip = getClientIp(request);
  const rateResult = rateLimiter.check(`deploy:${ip}`);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { data: null, error: { code: "RATE_LIMITED", message: "Too many requests" }, meta: null },
      {
        status: 429,
        headers: {
          ...headers,
          "Retry-After": String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateResult.resetAt),
        },
      },
    );
  }

  try {
    const body = await request.json();
    const validation = validateSafe(CreateDeploymentSchema, body);
    if (!validation.valid) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Validation failed", details: validation.errors }, meta: null },
        { status: 422, headers },
      );
    }

    const { tenantId, nicheSlug, pages, platform, target } = validation.data!;
    const platformTyped = platform as DeploymentPlatform;
    const deployTarget: DeploymentTarget = target
      ? { type: target.type, config: target.config || {} }
      : { type: platform === "github-pages" ? "github-pages" : platform === "cloudflare" ? "cloudflare-pages" : "vercel", config: {} };
    const job = await createDeployment(tenantId, nicheSlug, pages as PageDefinition[], deployTarget, platformTyped);

    return NextResponse.json(
      { data: job, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { code: "DEPLOY_FAILED", message: err instanceof Error ? err.message : "Deployment failed" }, meta: null },
      { status: 500, headers },
    );
  }
}

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

  const deployments = listDeployments(tenantId);
  return NextResponse.json(
    { data: deployments, error: null, meta: { total: deployments.length } },
    { headers },
  );
}
