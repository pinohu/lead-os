import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

const ALLOWED_HOST_PATTERNS = [
  /(^|\.)googleusercontent\.com$/i,
  /(^|\.)gstatic\.com$/i,
  /(^|\.)googleapis\.com$/i,
  /(^|\.)ggpht\.com$/i,
]

const LOW_QUALITY_PATTERNS = [
  "streetview",
  "staticmap",
  "logo",
  "avatar",
  "profile_photo",
]

export async function GET(req: NextRequest) {
  const rateLimited = await checkRateLimit(req, "provider-image")
  if (rateLimited) return rateLimited

  const rawUrl = req.nextUrl.searchParams.get("url")
  const width = parseInt(req.nextUrl.searchParams.get("w") ?? "800", 10)

  if (!rawUrl) {
    return NextResponse.json({ error: "Missing image URL" }, { status: 400 })
  }

  let target: URL
  try {
    target = new URL(rawUrl)
  } catch {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 })
  }

  if (target.protocol !== "https:" || !ALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(target.hostname))) {
    return NextResponse.json({ error: "Image host is not allowed" }, { status: 400 })
  }

  const normalized = target.toString().toLowerCase()
  if (LOW_QUALITY_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return NextResponse.json({ error: "Low-quality image source rejected" }, { status: 400 })
  }

  const maxWidth = Math.min(Math.max(width, 120), 1600)
  if (target.hostname.includes("googleusercontent.com") && !target.search && !target.pathname.includes("=w")) {
    target.searchParams.set("w", String(maxWidth))
  }

  try {
    const response = await fetch(target, {
      redirect: "follow",
      headers: {
        accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    })

    if (!response.ok) {
      logger.warn("provider-image", `Image fetch failed (${response.status}) for ${target.hostname}`)
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg"
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Remote resource is not an image" }, { status: 415 })
    }

    const body = await response.arrayBuffer()
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
        "CDN-Cache-Control": "public, max-age=604800",
      },
    })
  } catch (err) {
    logger.error("provider-image", "Proxy error:", err)
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 })
  }
}
