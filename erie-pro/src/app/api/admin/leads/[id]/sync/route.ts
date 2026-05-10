import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { audit } from "@/lib/audit-log"
import { syncLeadToBoostspace } from "@/lib/lead-external-sync"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_req: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  await syncLeadToBoostspace(id)

  await audit({
    action: "lead.external_sync_requested",
    entityType: "lead",
    entityId: id,
    metadata: { requestedBy: session.user.email ?? "admin" },
  })

  return NextResponse.json({ success: true, message: "External sync requested." })
}
