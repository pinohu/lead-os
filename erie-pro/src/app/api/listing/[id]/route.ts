import { NextRequest, NextResponse } from "next/server"
import { getDirectoryListingById } from "@/lib/directory-store"
import { checkRateLimit } from "@/lib/rate-limit"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Public endpoint — allow normal browsing but throttle scraping bursts.
  const limited = await checkRateLimit(req, "listing")
  if (limited) return limited

  const { id } = await params
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  try {
    const listing = await getDirectoryListingById(id)
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json({
      businessName: listing.businessName,
      phone: listing.phone,
      niche: listing.niche,
      addressCity: listing.addressCity,
      addressState: listing.addressState,
      website: listing.website,
      description: listing.description,
    })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
