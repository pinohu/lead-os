import { fetchAgentActivity } from "@/lib/relay-client"
import { apiSuccess, apiError } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await fetchAgentActivity()
    return apiSuccess(data ?? { totalAgents: 0, activeNow: 0, agents: [], lastUpdate: new Date().toISOString() })
  } catch {
    return apiError("Could not fetch agent activity", 500)
  }
}
