import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getMagnetBySlug } from "@/lib/lead-magnet-engine";

const MAX_SLUG_LENGTH = 200;
// Slug characters: lowercase alphanumeric and hyphens only.
const VALID_SLUG_PATTERN = /^[a-z0-9-]{1,200}$/;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const { slug } = await params;

    // Validate slug before lookup to prevent excessively long strings from
    // being used as lookup keys and to avoid reflecting untrusted input in
    // error messages.
    if (!slug || slug.length > MAX_SLUG_LENGTH || !VALID_SLUG_PATTERN.test(slug)) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Lead magnet not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const magnet = getMagnetBySlug(slug);

    if (!magnet) {
      // Use a generic message — do not reflect the slug back to the caller.
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Lead magnet not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: magnet, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { code: "FETCH_FAILED", message: "Failed to fetch lead magnet" },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}
