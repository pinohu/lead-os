import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    await query("SELECT 1")
    return NextResponse.json({
      status: "ok",
      components: {
        database: "healthy",
      },
    })
  } catch (error) {
    return NextResponse.json({
      status: "degraded",
      components: {
        database: "down",
        error: error instanceof Error ? error.message : String(error),
      },
    })
  }
}
