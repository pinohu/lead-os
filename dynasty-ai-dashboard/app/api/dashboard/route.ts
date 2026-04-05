import { NextResponse } from "next/server"
import { fetchAgentActivity, fetchCosts } from "@/lib/relay-client"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [agents, costs] = await Promise.all([
      fetchAgentActivity(),
      fetchCosts(),
    ])

    if (agents && costs) {
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        agents,
        costs,
        source: "relay",
      })
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      agents: { totalAgents: 0, activeNow: 0, agents: [], lastUpdate: new Date().toISOString() },
      costs: { today: 0, thisMonth: 0, monthlyTarget: 300 },
      source: "fallback",
    })
  } catch (error) {
    console.error("Dashboard fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}
