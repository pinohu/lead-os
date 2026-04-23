import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { createAsset, listAssets, searchAssets, type Asset } from "@/lib/asset-manager";

const MAX_NAME_LENGTH = 200;
const MAX_URL_LENGTH = 2000;
const MAX_ALT_LENGTH = 500;
const MAX_TAGS = 20;
const VALID_TYPES = new Set<Asset["type"]>(["image", "pdf", "video", "document", "other"]);

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

    const query = url.searchParams.get("q");
    const type = url.searchParams.get("type") as Asset["type"] | null;

    let assets: Asset[];
    if (query) {
      assets = searchAssets(tenantId, query);
    } else {
      assets = listAssets(tenantId, type && VALID_TYPES.has(type) ? type : undefined);
    }

    return NextResponse.json(
      { data: assets, error: null, meta: { count: assets.length } },
      { headers },
    );
  } catch (err) {
    logger.error("assets failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: "Failed to list assets" }, meta: null },
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

    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "name is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `name must not exceed ${MAX_NAME_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.url || typeof body.url !== "string" || body.url.length > MAX_URL_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "url is required and must not exceed 2000 characters" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.type || !VALID_TYPES.has(body.type)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `type must be one of: ${[...VALID_TYPES].join(", ")}` }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.mimeType || typeof body.mimeType !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "mimeType is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.alt && body.alt.length > MAX_ALT_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `alt must not exceed ${MAX_ALT_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.tags && Array.isArray(body.tags) && body.tags.length > MAX_TAGS) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `tags must not exceed ${MAX_TAGS}` }, meta: null },
        { status: 400, headers },
      );
    }

    const asset = createAsset({
      tenantId: body.tenantId,
      name: body.name.trim(),
      url: body.url,
      type: body.type,
      mimeType: body.mimeType,
      sizeBytes: typeof body.sizeBytes === "number" ? body.sizeBytes : undefined,
      alt: body.alt ?? undefined,
      tags: Array.isArray(body.tags) ? body.tags : [],
    });

    return NextResponse.json(
      { data: asset, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("assets failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create asset" }, meta: null },
      { status: 500, headers },
    );
  }
}
