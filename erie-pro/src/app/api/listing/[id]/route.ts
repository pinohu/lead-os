import { NextResponse } from "next/server"
import { getDirectoryListingById } from "@/lib/directory-store"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
