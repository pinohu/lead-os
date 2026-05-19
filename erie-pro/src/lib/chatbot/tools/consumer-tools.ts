// erie-pro/src/lib/chatbot/tools/consumer-tools.ts

import { cityConfig } from "@/lib/city-config"
import { getDirectoryListingsByNiche, getDirectoryListingsByNicheAndArea } from "@/lib/directory-store"
import type { ChatToolContext, ToolResult } from "@/lib/chatbot/tools/types"

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined
}

export async function executeConsumerTool(
  toolName: string,
  input: Record<string, unknown>,
  _ctx: ChatToolContext,
): Promise<ToolResult> {
  switch (toolName) {
    case "searchProviders": {
      const niche = str(input.niche)
      if (!niche) return { ok: false, error: "niche is required" }
      const area = str(input.area)
      const limit = Math.min(Number.parseInt(str(input.limit) ?? "8", 10) || 8, 20)
      const listings = area
        ? await getDirectoryListingsByNicheAndArea(niche, area, { limit })
        : await getDirectoryListingsByNiche(niche, { limit })
      return {
        ok: true,
        data: {
          count: listings.length,
          providers: listings.map((l) => ({
            slug: l.slug,
            name: l.businessName,
            niche: l.niche,
            rating: l.rating,
            reviewCount: l.reviewCount,
            city: l.addressCity,
          })),
        },
      }
    }
    case "checkServiceArea": {
      const zip = str(input.zip)
      const city = (str(input.city) ?? "erie").toLowerCase()
      const served = cityConfig.serviceArea.some(
        (a) => a.toLowerCase() === city || a.toLowerCase().includes(city),
      )
      const zipOk = zip ? /^16[0-5]\d{2}$/.test(zip) : null
      return {
        ok: true,
        data: {
          inServiceArea: served || zipOk === true,
          city,
          zip,
          serviceAreas: cityConfig.serviceArea,
        },
      }
    }
    case "createServiceRequest": {
      const email = str(input.email)
      const niche = str(input.niche)
      const message = str(input.message)
      if (!email || !niche || !message) {
        return { ok: false, error: "email, niche, and message are required" }
      }
      return {
        ok: false,
        error:
          "Service requests require TCPA consent on the official form. Direct the user to /get-matched to submit with consent.",
        data: { email, niche, messagePreview: message.slice(0, 120) },
      }
    }
    default:
      return { ok: false, error: `Unknown consumer tool: ${toolName}` }
  }
}
