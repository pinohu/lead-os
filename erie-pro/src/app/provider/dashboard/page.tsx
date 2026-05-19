import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { ProviderOfferDisclaimer } from "@/components/provider-offer-disclaimer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function ProviderOfferDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login?callbackUrl=/provider/dashboard")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { providerId: true },
  })

  const providerProfile = user?.providerId
    ? await prisma.provider.findUnique({
        where: { id: user.providerId },
        select: {
          businessName: true,
          lifecycleStatus: true,
          eligibilityTier: true,
          verificationStatus: true,
        },
      })
    : null

  const subscription = user?.providerId
    ? await prisma.providerSubscription.findUnique({
        where: { providerId: user.providerId },
        include: { plan: true },
      })
    : null

  const microsite = user?.providerId
    ? await prisma.microsite.findFirst({
        where: { providerId: user.providerId },
        orderBy: { updatedAt: "desc" },
      })
    : null

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold">Local Authority dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        {providerProfile?.businessName ?? "Complete claim or checkout to link a profile."}
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Plan: {subscription?.plan.displayName ?? "—"}</p>
            <p>
              Lifecycle: <Badge variant="outline">{providerProfile?.lifecycleStatus ?? "—"}</Badge>
            </p>
            <p>
              Eligibility: <Badge variant="secondary">{providerProfile?.eligibilityTier ?? "—"}</Badge>
            </p>
            <p className="text-xs text-muted-foreground">Payment does not mean verified or published.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Microsite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Status: {microsite?.status ?? "not provisioned"}</p>
            <p>Publish mode: {microsite?.publishMode ?? "—"}</p>
            <p>Data quality score: {microsite?.dataQualityScore?.toFixed(2) ?? "—"} (internal)</p>
          </CardContent>
        </Card>
      </div>
      <p className="mt-6">
        <Link href="/dashboard" className="text-primary underline">
          Open full provider portal (leads, settings)
        </Link>
      </p>
      <div className="mt-8 space-y-3">
        <ProviderOfferDisclaimer />
        <ProviderOfferDisclaimer variant="leads" />
      </div>
    </main>
  )
}
