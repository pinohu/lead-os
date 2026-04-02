// ── Google Places Photo Proxy ──────────────────────────────────────
// Proxies Google Places photo requests to keep the API key server-side.
// GET /api/places-photo?ref={photoName}&w={maxWidth}

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";
const BASE_URL = "https://places.googleapis.com/v1";

// Validate photo reference format (Google Places photo names look like:
// "places/ChIJ.../photos/AelY...")
const PHOTO_REF_PATTERN = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

export async function GET(req: NextRequest) {
  // Rate limit: 100 per minute per IP
  const rateLimited = await checkRateLimit(req, "places-photo");
  if (rateLimited) return rateLimited;

  const ref = req.nextUrl.searchParams.get("ref");
  const width = parseInt(req.nextUrl.searchParams.get("w") ?? "800", 10);

  if (!ref || !PHOTO_REF_PATTERN.test(ref)) {
    return NextResponse.json(
      { error: "Invalid or missing photo reference" },
      { status: 400 }
    );
  }

  if (!API_KEY) {
    return NextResponse.json(
      { error: "Photo service unavailable" },
      { status: 503 }
    );
  }

  const maxWidth = Math.min(Math.max(width, 100), 1600);

  try {
    const photoUrl = `${BASE_URL}/${ref}/media?maxWidthPx=${maxWidth}&key=${API_KEY}`;
    const response = await fetch(photoUrl, { redirect: "follow" });

    if (!response.ok) {
      logger.warn("places-photo", `Photo fetch failed (${response.status}) for ref: ${ref}`);
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      );
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
        "CDN-Cache-Control": "public, max-age=604800",
      },
    });
  } catch (err) {
    logger.error("places-photo", "Proxy error:", err);
    return NextResponse.json(
      { error: "Failed to fetch photo" },
      { status: 500 }
    );
  }
}
