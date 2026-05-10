import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { prisma } from "@/lib/db"
import { claimWebsitePreview } from "../actions"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Claim Website Preview | Erie.pro",
  robots: { index: false, follow: false },
}

export default async function ClaimPreviewPage({
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
        <h1 className="mt-4 text-3xl font-black">Claim this preview</h1>
        <p className="mt-2 text-slate-600">
          Tell us how to reach the owner or authorized manager for {listing.businessName}.
        </p>
        {submitted === "1" ? (
          <div className="mt-6 rounded-md bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            Claim request received. Erie.pro will review it before activating anything as official.
          </div>
        ) : (
          <form action={claimWebsitePreview} className="mt-6 space-y-4">
            <input type="hidden" name="slug" value={listing.slug} />
            <label className="block text-sm font-semibold">
              Your name
              <input name="name" required className="mt-1 w-full rounded-md border px-3 py-2" />
            </label>
            <label className="block text-sm font-semibold">
              Work email
              <input name="email" type="email" required className="mt-1 w-full rounded-md border px-3 py-2" />
            </label>
            <label className="block text-sm font-semibold">
              Phone
              <input name="phone" required className="mt-1 w-full rounded-md border px-3 py-2" />
            </label>
            <label className="block text-sm font-semibold">
              What should we change before launch?
              <textarea name="note" rows={4} className="mt-1 w-full rounded-md border px-3 py-2" />
            </label>
            <button className="w-full rounded-md bg-[#f93355] px-4 py-3 font-bold text-white">
              Submit claim request
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
