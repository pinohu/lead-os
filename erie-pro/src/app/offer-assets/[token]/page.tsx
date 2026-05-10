import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Download, ShieldCheck } from "lucide-react"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type Props = { params: Promise<{ token: string }> }

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Your Erie.Pro Deliverable",
  robots: { index: false, follow: false },
}

export default async function OfferAssetPage({ params }: Props) {
  const { token } = await params
  const asset = await prisma.generatedAsset.findUnique({
    where: { publicToken: token },
    include: {
      purchase: {
        include: {
          offer: true,
          customer: true,
        },
      },
    },
  })

  if (!asset) notFound()
  if (asset.expiresAt && asset.expiresAt < new Date()) notFound()

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Erie.Pro
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <ShieldCheck className="h-4 w-4 text-teal-700" />
            Automated Erie County deliverable
          </div>
        </div>

        <Card className="mb-6 border-slate-200 bg-white">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                  {asset.purchase.offer.title}
                </p>
                <h1 className="mt-1 text-2xl font-bold text-slate-950">{asset.title}</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">{asset.summary}</p>
              </div>
              {asset.downloadUrl && (
                <Button asChild>
                  <a href={asset.downloadUrl}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div
          className="rounded-lg border border-slate-200 bg-white shadow-sm"
          dangerouslySetInnerHTML={{ __html: asset.contentHtml ?? "<p>Deliverable content is unavailable.</p>" }}
        />
      </div>
    </main>
  )
}
