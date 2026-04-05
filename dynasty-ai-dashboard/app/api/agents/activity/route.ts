import { NextResponse } from "next/server"
import { fetchAgentActivity, type AgentActivityResponse } from "@/lib/relay-client"

export const dynamic = "force-dynamic"

const FALLBACK: AgentActivityResponse = {
  totalAgents: 0,
  activeNow: 0,
  agents: [],
  lastUpdate: new Date().toISOString(),
}

export async function GET() {
  try {
    const data = await fetchAgentActivity()
    return NextResponse.json(data ?? FALLBACK)
  } catch (error) {
    console.error("Agent activity fetch error:", error)
    return NextResponse.json(
      { ...FALLBACK, error: "Could not fetch agent activity" },
      { status: 500 }
    )
  }
}
