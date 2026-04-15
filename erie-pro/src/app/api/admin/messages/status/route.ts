import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { requireAdmin } from "@/lib/require-admin"
import { logger } from "@/lib/logger"
import { MAX_BODY_SIZE } from "@/lib/validation"

const UpdateStatusSchema = z.object({
  messageId: z.string().min(1, "messageId is required"),
  status: z.enum(["read", "replied"], {
    error: 'status must be "read" or "replied"',
  }),
})

export async function POST(req: NextRequest) {
  try {
    // ── Auth: require admin session ─────────────────────────────
    const unauthorized = await requireAdmin()
    if (unauthorized) return unauthorized

    // ── Body size check ──────────────────────────────────────────
    const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10)
    if (contentLength > MAX_BODY_SIZE) {
      return NextResponse.json(
        { success: false, error: "Request body too large" },
        { status: 413 }
      )
    }

    // ── Parse body ─────────────────────────────────────────────
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      )
    }

    // ── Zod validation ─────────────────────────────────────────
    const parsed = UpdateStatusSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((e) => e.message).join("; ") },
        { status: 400 }
      )
    }

    const { messageId, status } = parsed.data

    // ── Update ─────────────────────────────────────────────────
    await prisma.contactMessage.update({
      where: { id: messageId },
      data: { status },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("/api/admin/messages/status", "Error:", err)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
