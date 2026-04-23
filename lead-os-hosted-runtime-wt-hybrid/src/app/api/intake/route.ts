import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { log } from "@/lib/logger"
import { intakeSchema } from "@/lib/validate"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = intakeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const { email, firstName, message } = parsed.data
    const result = await query<{ id: number }>(
      "INSERT INTO leads (email, name, message) VALUES ($1, $2, $3) RETURNING id",
      [email, firstName ?? null, message],
    )

    const id = result.rows[0]?.id
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Failed to create lead" },
        { status: 500 },
      )
    }

    log("intake.created", { leadId: id, email })
    return NextResponse.json({ success: true, id })
  } catch (error) {
    log("intake.error", {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { success: false, error: "Failed to process intake" },
      { status: 500 },
    )
  }
}
