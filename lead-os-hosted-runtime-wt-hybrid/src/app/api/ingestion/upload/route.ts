import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { extractMarketingArtifact } from "@/lib/marketing-ingestion";
import { addArtifact, listArtifacts, removeArtifact } from "@/lib/marketing-artifact-store";
import { convertArtifactToIngestion } from "@/lib/marketing-artifact-to-ingestion";
import { convertIngestionToDesignSpec } from "@/lib/design-ingestion-to-spec";
import { generateNicheConfig } from "@/lib/niche-generator";
import type { MarketingArtifact } from "@/lib/marketing-ingestion";

const VALID_SOURCE_TYPES: MarketingArtifact["sourceType"][] = [
  "flyer", "mailer", "billboard", "business-card", "ad", "brochure", "other",
];

function isValidSourceType(value: unknown): value is MarketingArtifact["sourceType"] {
  return typeof value === "string" && VALID_SOURCE_TYPES.includes(value as MarketingArtifact["sourceType"]);
}

// ---------------------------------------------------------------------------
// POST — upload and analyze an artifact
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const contentType = request.headers.get("content-type") ?? "";

  let text: string;
  let sourceType: MarketingArtifact["sourceType"];
  let tenantId: string;
  let nicheSlug: string | undefined;
  let geoHint: string | undefined;

  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { data: null, error: { code: "INVALID_FORM", message: "Failed to parse multipart form data" }, meta: null },
        { status: 400, headers },
      );
    }

    const rawText = formData.get("text");
    if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "OCR_TEXT_REQUIRED",
            message: "OCR text is required. Extract text from the image before uploading, or use a vision provider.",
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    text = rawText.trim();
    const rawSourceType = formData.get("sourceType");
    sourceType = isValidSourceType(rawSourceType) ? rawSourceType : "other";
    tenantId = typeof formData.get("tenantId") === "string" ? (formData.get("tenantId") as string) : "default-tenant";
    nicheSlug = typeof formData.get("nicheSlug") === "string" ? (formData.get("nicheSlug") as string) || undefined : undefined;
    geoHint = typeof formData.get("geoHint") === "string" ? (formData.get("geoHint") as string) || undefined : undefined;
  } else {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { data: null, error: { code: "INVALID_JSON", message: "Request body must be valid JSON" }, meta: null },
        { status: 400, headers },
      );
    }

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Request body must be an object" }, meta: null },
        { status: 400, headers },
      );
    }

    const b = body as Record<string, unknown>;

    if (typeof b.text !== "string" || b.text.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "text is required and must be a non-empty string" }, meta: null },
        { status: 400, headers },
      );
    }

    text = b.text.trim();
    sourceType = isValidSourceType(b.sourceType) ? b.sourceType : "other";
    tenantId = typeof b.tenantId === "string" && b.tenantId.trim().length > 0 ? b.tenantId.trim() : "default-tenant";
    nicheSlug = typeof b.nicheSlug === "string" && b.nicheSlug.trim().length > 0 ? b.nicheSlug.trim() : undefined;
    geoHint = typeof b.geoHint === "string" && b.geoHint.trim().length > 0 ? b.geoHint.trim() : undefined;
  }

  try {
    const artifact = extractMarketingArtifact({ text, tenantId, sourceType, geoHint });
    await addArtifact(artifact);

    const ingestion = convertArtifactToIngestion(artifact);

    let suggestedSpec = undefined;
    if (nicheSlug) {
      const nicheConfig = generateNicheConfig({ name: nicheSlug });
      suggestedSpec = convertIngestionToDesignSpec(ingestion, nicheConfig);
    }

    return NextResponse.json(
      {
        data: {
          artifact,
          ingestion,
          suggestedSpec: suggestedSpec ?? null,
        },
        error: null,
        meta: null,
      },
      { headers },
    );
  } catch (err) {
    logger.error("ingestion/upload failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "INGEST_FAILED", message: "Failed to analyze marketing artifact" }, meta: null },
      { status: 500, headers },
    );
  }
}

// ---------------------------------------------------------------------------
// GET — list artifacts for a tenant
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId") ?? "default-tenant";

  try {
    const artifacts = await listArtifacts(tenantId);
    return NextResponse.json(
      { data: artifacts, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("ingestion/upload GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch artifacts" }, meta: null },
      { status: 500, headers },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE — remove an artifact
// ---------------------------------------------------------------------------

export async function DELETE(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  let id = searchParams.get("id");

  if (!id) {
    try {
      const body = await request.json() as Record<string, unknown>;
      if (typeof body.id === "string") id = body.id;
    } catch {
      // id stays null
    }
  }

  if (!id || id.trim().length === 0) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "id is required" }, meta: null },
      { status: 400, headers },
    );
  }

  try {
    await removeArtifact(id.trim());
    return new NextResponse(null, { status: 204, headers });
  } catch (err) {
    logger.error("ingestion/upload DELETE failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "DELETE_FAILED", message: "Failed to remove artifact" }, meta: null },
      { status: 500, headers },
    );
  }
}
