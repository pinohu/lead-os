import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { createPage, listPages, type LandingPage } from "@/lib/page-builder";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,98}[a-z0-9]$/;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_BLOCKS = 100;
const VALID_STATUSES = new Set<LandingPage["status"]>(["draft", "published", "archived"]);

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const status = url.searchParams.get("status") as LandingPage["status"] | null;
    const pages = listPages(
      tenantId,
      status && VALID_STATUSES.has(status) ? status : undefined,
    );

    return NextResponse.json(
      { data: pages, error: null, meta: { count: pages.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: "Failed to list pages" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const body = await request.json();

    if (!body.tenantId || typeof body.tenantId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.slug || typeof body.slug !== "string" || !SLUG_PATTERN.test(body.slug)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "slug must be 2-100 lowercase alphanumeric characters with hyphens" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.title || typeof body.title !== "string" || body.title.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "title is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.title.length > MAX_TITLE_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `title must not exceed ${MAX_TITLE_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.description && body.description.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `description must not exceed ${MAX_DESCRIPTION_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.blocks && Array.isArray(body.blocks) && body.blocks.length > MAX_BLOCKS) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `blocks must not exceed ${MAX_BLOCKS}` }, meta: null },
        { status: 400, headers },
      );
    }

    const page = createPage({
      tenantId: body.tenantId,
      slug: body.slug,
      title: body.title.trim(),
      description: body.description ?? "",
      blocks: Array.isArray(body.blocks) ? body.blocks : [],
      seo: {
        title: body.seo?.title ?? body.title.trim(),
        description: body.seo?.description ?? body.description ?? "",
        ogImage: body.seo?.ogImage,
      },
      styles: {
        primaryColor: body.styles?.primaryColor ?? "#14b8a6",
        backgroundColor: body.styles?.backgroundColor ?? "#ffffff",
        fontFamily: body.styles?.fontFamily ?? "Inter",
      },
      status: "draft",
    });

    return NextResponse.json(
      { data: page, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create page";
    const status = message.includes("already exists") ? 409 : 500;
    return NextResponse.json(
      { data: null, error: { code: status === 409 ? "CONFLICT" : "CREATE_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}
