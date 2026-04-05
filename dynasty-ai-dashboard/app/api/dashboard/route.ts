import { NextResponse } from "next/server"
import { fetchAgentActivity, fetchCosts } from "@/lib/relay-client"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [agentsResult, costsResult] = await Promise.allSettled([
      fetchAgentActivity(),
      fetchCosts(),
    ])

    const agents =
      agentsResult.status === "fulfilled" && agentsResult.value
        ? agentsResult.value
        : { totalAgents: 0, activeNow: 0, agents: [], lastUpdate: new Date().toISOString() }

    const costs =
      costsResult.status === "fulfilled" && costsResult.value
        ? costsResult.value
        : { today: 0, thisMonth: 0, monthlyTarget: 300 }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      agents,
      costs,
      source:
        agentsResult.status === "fulfilled" && agentsResult.value
          ? "relay"
          : "fallback",
    })
  } catch (error) {
    console.error("Dashboard fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}
