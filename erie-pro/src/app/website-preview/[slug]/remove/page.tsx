import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { prisma } from "@/lib/db"
import { declineWebsitePreview, doNotContactWebsitePreview } from "../actions"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Remove Website Preview | Erie.pro",
  robots: { index: false, follow: false },
}

export default async function RemovePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ submitted?: string }>
}) {
  const { slug } = await params
  const { submitted } = await searchParams
  const rows = await prisma.$queryRawUnsafe<{ businessName: string; slug: string }[]>(
    `
      SELECT dl."businessName", dl.slug
      FROM website_opportunities wo
      JOIN directory_listings dl ON dl.id = wo.listing_id
      WHERE dl.slug = $1
      LIMIT 1
    `,
    slug
  )

  const listing = rows[0]
  if (!listing) notFound()

  return (
    <main className="min-h-screen bg-[#080d14] px-4 py-10 text-white">
      <div className="mx-auto max-w-xl rounded-md border border-white/10 bg-white p-6 text-slate-950">
        <Link href={`/website-preview/${listing.slug}`} className="text-sm font-semibold text-[#f93355]">
          Back to preview
        </Link>
        <h1 className="mt-4 text-3xl font-black">Remove or decline this preview</h1>
        <p className="mt-2 text-slate-600">
          If you own or manage {listing.businessName}, you can request removal or ask us not to contact
          the business about this offer.
        </p>
        {submitted === "1" ? (
          <div className="mt-6 rounded-md bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            Request received. The preview opportunity has been marked accordingly.
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            <form action={declineWebsitePreview} className="space-y-4 rounded-md border p-4">
              <input type="hidden" name="slug" value={listing.slug} />
              <input name="name" placeholder="Your name" className="w-full rounded-md border px-3 py-2" />
              <input name="email" type="email" placeholder="Email" className="w-full rounded-md border px-3 py-2" />
              <textarea name="note" rows={3} placeholder="Reason or correction" className="w-full rounded-md border px-3 py-2" />
              <button className="w-full rounded-md border border-slate-300 px-4 py-3 font-bold">
                Decline or request removal
              </button>
            </form>
            <form action={doNotContactWebsitePreview} className="space-y-4 rounded-md border p-4">
              <input type="hidden" name="slug" value={listing.slug} />
              <input name="email" type="email" placeholder="Email for suppression note" className="w-full rounded-md border px-3 py-2" />
              <button className="w-full rounded-md bg-slate-950 px-4 py-3 font-bold text-white">
                Mark as do not contact
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
