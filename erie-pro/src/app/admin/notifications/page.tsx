import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { AdminNotificationsClient } from "./admin-notifications-client"

export const dynamic = "force-dynamic"

export default async function AdminNotificationsPage() {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    redirect("/login?callbackUrl=/admin/notifications")
  }

  const events = await prisma.notificationEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      serviceRequest: { select: { requestId: true, niche: true, status: true } },
      template: { select: { slug: true } },
    },
  })

  const rows = events.map((e) => ({
    id: e.id,
    requestId: e.serviceRequest.requestId,
    templateSlug: e.template.slug,
    recipientEmail: e.recipientEmail,
    recipientRole: e.recipientRole,
    status: e.status,
    retryCount: e.retryCount,
    maxRetries: e.maxRetries,
    lastError: e.lastError,
    nextRetryAt: e.nextRetryAt?.toISOString() ?? null,
    sentAt: e.sentAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notification events</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Service request emails with retry queue. Provider notified only when status is sent.
        </p>
      </div>
      <AdminNotificationsClient initialEvents={rows} />
    </div>
  )
}
