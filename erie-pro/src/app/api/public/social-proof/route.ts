// erie-pro/src/app/api/public/social-proof/route.ts
import { NextResponse } from "next/server"
import { cityConfig } from "@/lib/city-config"
import { niches } from "@/lib/niches"
import { getDirectoryListingCount } from "@/lib/directory-store"

export const dynamic = "force-dynamic"

export interface SocialProofPayload {
  metroLabel: string
  serviceCount: number
  communityCount: number
  listingCount: number | null
  messages: string[]
}

const STATIC_MESSAGES = [
  "Homeowners matched with one vetted Erie County pro",
  "No bidding wars — free match in under 4 hours",
  "Licensed & insured pros across Erie, Millcreek, Harborcreek & more",
]

export async function GET() {
  let listingCount: number | null = null
  try {
    if (process.env.DATABASE_URL) {
      listingCount = await getDirectoryListingCount()
    }
  } catch {
    listingCount = null
  }

  const payload: SocialProofPayload = {
    metroLabel: cityConfig.metroArea,
    serviceCount: niches.length,
    communityCount: cityConfig.serviceArea.length,
    listingCount,
    messages: STATIC_MESSAGES,
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  })
}
