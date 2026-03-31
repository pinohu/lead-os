import { NextResponse } from "next/server"
import { routeLead } from "@/lib/lead-routing"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, phone, email, message, niche, city, provider } =
      body

    // Validate required fields
    if (!email || !niche) {
      return NextResponse.json(
        { success: false, error: "Email and niche are required" },
        { status: 400 }
      )
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Route the lead through the distribution engine
    const result = routeLead(niche, city ?? "erie", {
      firstName,
      lastName,
      phone,
      email,
      message,
      provider,
      source: "erie-pro",
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      leadId: result.leadId,
      routedTo: result.routedTo?.businessName ?? "Queued for matching",
      message:
        "Your request has been received. A provider will contact you shortly.",
    })
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    )
  }
}
