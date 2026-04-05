import { NextResponse } from "next/server"
import { fetchCosts, type CostResponse } from "@/lib/relay-client"

export const dynamic = "force-dynamic"

const FALLBACK: CostResponse = {
  today: 0,
  thisMonth: 0,
  monthlyTarget: 300,
}

export async function GET() {
  try {
    const data = await fetchCosts()
    return NextResponse.json({
      ...(data ?? FALLBACK),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Cost fetch error:", error)
    return NextResponse.json(
      { ...FALLBACK, error: "Could not fetch cost metrics", timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
