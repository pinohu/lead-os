import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  loadCatalog,
  getMagnetsByCategory,
  getMagnetsByNiche,
  recommendMagnets,
  recordDelivery,
} from "@/lib/lead-magnet-engine";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const niche = url.searchParams.get("niche");
    const category = url.searchParams.get("category");
    const recommend = url.searchParams.get("recommend");
    const funnelFamily = url.searchParams.get("funnelFamily");
    const source = url.searchParams.get("source");
    const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);
    const clampedLimit = Math.min(Math.max(1, limit), 100);

    if (recommend === "true") {
      const recommendations = recommendMagnets(
        {
          niche: niche ?? undefined,
          funnelFamily: funnelFamily ?? undefined,
          source: source ?? undefined,
        },
        clampedLimit,
      );
      return NextResponse.json(
        {
          data: recommendations,
          error: null,
          meta: { count: recommendations.length },
        },
        { headers },
      );
    }

    let magnets = loadCatalog();

    if (niche) {
      magnets = getMagnetsByNiche(niche);
    }
    if (category) {
      const byCat = getMagnetsByCategory(category);
      if (niche) {
        const nicheIds = new Set(magnets.map((m) => m.id));
        magnets = byCat.filter((m) => nicheIds.has(m.id));
      } else {
        magnets = byCat;
      }
    }

    const page = magnets.slice(0, clampedLimit);

    return NextResponse.json(
      {
        data: page,
        error: null,
        meta: { count: page.length, total: magnets.length },
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { code: "LIST_FAILED", message: "Failed to list lead magnets" },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

const MAX_LEAD_KEY_LENGTH = 128;
const MAX_MAGNET_ID_LENGTH = 128;
const SAFE_ID_PATTERN = /^[\w-]{1,128}$/;
// Limit metadata to a flat object with bounded key/value lengths to prevent
// unbounded memory growth from attacker-supplied nested objects.
const MAX_METADATA_KEYS = 20;
const MAX_METADATA_KEY_LENGTH = 64;
const MAX_METADATA_VALUE_LENGTH = 256;

function isValidMetadata(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== "object" || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length > MAX_METADATA_KEYS) return false;
  return keys.every(
    (k) =>
      k.length <= MAX_METADATA_KEY_LENGTH &&
      (typeof obj[k] === "string"
        ? obj[k].length <= MAX_METADATA_VALUE_LENGTH
        : typeof obj[k] === "number" || typeof obj[k] === "boolean" || obj[k] === null),
  );
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

    if (!body.leadKey || typeof body.leadKey !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "leadKey is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.leadKey.length > MAX_LEAD_KEY_LENGTH || !SAFE_ID_PATTERN.test(body.leadKey)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "leadKey must contain only alphanumeric characters, underscores, or hyphens and be at most 128 characters" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.magnetId || typeof body.magnetId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "magnetId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.magnetId.length > MAX_MAGNET_ID_LENGTH || !SAFE_ID_PATTERN.test(body.magnetId)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "magnetId must contain only alphanumeric characters, underscores, or hyphens and be at most 128 characters" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.metadata !== undefined && !isValidMetadata(body.metadata)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "metadata must be a flat object with at most 20 string/number/boolean keys" }, meta: null },
        { status: 400, headers },
      );
    }

    const delivery = await recordDelivery({
      leadKey: body.leadKey,
      magnetId: body.magnetId,
      status: "pending",
      metadata: body.metadata ?? {},
    });

    return NextResponse.json(
      { data: delivery, error: null, meta: null },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { code: "DELIVERY_FAILED", message: "Failed to record delivery" },
        meta: null,
      },
      { status: 400, headers },
    );
  }
}
