import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const metadata: Metadata = {
  title: "ThriveCart Events | Erie.Pro Admin",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function AdminThriveCartEventsPage() {
  const [events, unmatchedCount] = await Promise.all([
    prisma.thriveCartEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { reconciliationItems: true },
    }),
    prisma.thriveCartReconciliationItem.count({ where: { status: "unmatched" } }),
  ])

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">ThriveCart events</h1>
        <p className="text-sm text-muted-foreground">
          Unmatched reconciliation queue: {unmatchedCount} — resolve before provisioning manually.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent events</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Reconciliation</TableHead>
                <TableHead>Processing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="text-xs">{event.createdAt.toISOString().slice(0, 16)}</TableCell>
                  <TableCell>{event.eventType}</TableCell>
                  <TableCell>{event.customerEmail ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={event.reconciliationStatus === "unmatched" ? "destructive" : "outline"}>
                      {event.reconciliationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{event.processingStatus}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-sm">
        <Link href="/admin/provider-offers" className="underline">
          Provider offers admin
        </Link>
      </p>
    </div>
  )
}
