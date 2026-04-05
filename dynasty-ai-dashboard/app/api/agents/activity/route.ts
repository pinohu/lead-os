import { NextResponse } from "next/server"
import { fetchAgentActivity, type AgentActivityResponse } from "@/lib/relay-client"

export const dynamic = "force-dynamic"

function getFallback(): AgentActivityResponse {
  return {
    totalAgents: 0,
    activeNow: 0,
    agents: [],
    lastUpdate: new Date().toISOString(),
  }
}

export async function GET() {
  try {
    const data = await fetchAgentActivity()
    return NextResponse.json(data ?? getFallback())
  } catch (error) {
    console.error("Agent activity fetch error:", error)
    return NextResponse.json(
      { ...getFallback(), error: "Could not fetch agent activity" },
      { status: 500 }
    )
  }
}
