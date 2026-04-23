import { NextResponse } from "next/server"
import { requireAuth, toAuthErrorResponse } from "@/lib/auth"
import { query } from "@/lib/db"
import type { Lead } from "@/types/lead"

export async function GET(request: Request) {
  try {
    requireAuth(request)

    const result = await query<Lead>(
      `SELECT id, email, name, message, tenant_id, created_at
       FROM leads
       ORDER BY created_at DESC
       LIMIT 50`,
    )

    return NextResponse.json({ success: true, leads: result.rows })
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return toAuthErrorResponse(error)
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch leads",
      },
      { status: 500 },
    )
  }
}
