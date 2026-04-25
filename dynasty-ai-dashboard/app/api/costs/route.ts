import { fetchCosts } from "@/lib/relay-client"
import { apiSuccess, apiError } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await fetchCosts()
    return apiSuccess(data ?? { today: 0, thisMonth: 0, monthlyTarget: 300 })
  } catch {
    return apiError("Could not fetch cost metrics", 500)
  }
}
