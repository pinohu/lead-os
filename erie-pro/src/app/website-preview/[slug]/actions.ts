"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"

async function updateOpportunityFromPreview(
  slug: string,
  status: "claimed" | "declined" | "do_not_contact",
  formData: FormData
) {
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim()
  const note = String(formData.get("note") ?? "").trim()

  const logEntry = JSON.stringify([
    {
      at: new Date().toISOString(),
      source: "website-preview",
      status,
      name,
      email,
      phone,
      note,
    },
  ])

  const timestampField =
    status === "claimed"
      ? "claimed_at = COALESCE(claimed_at, now()),"
      : "declined_at = COALESCE(declined_at, now()),"

  await prisma.$executeRawUnsafe(
    `
      UPDATE website_opportunities wo
      SET status = $1,
          ${timestampField}
          contact_log = contact_log || $2::jsonb,
          updated_at = now()
      FROM directory_listings dl
      WHERE dl.id = wo.listing_id
        AND dl.slug = $3
    `,
    status,
    logEntry,
    slug
  )

  revalidatePath(`/website-preview/${slug}`)
}

export async function claimWebsitePreview(formData: FormData) {
  const slug = String(formData.get("slug") ?? "")
  if (!slug) return
  await updateOpportunityFromPreview(slug, "claimed", formData)
  redirect(`/website-preview/${slug}/claim?submitted=1`)
}

export async function declineWebsitePreview(formData: FormData) {
  const slug = String(formData.get("slug") ?? "")
  if (!slug) return
  await updateOpportunityFromPreview(slug, "declined", formData)
  redirect(`/website-preview/${slug}/remove?submitted=1`)
}

export async function doNotContactWebsitePreview(formData: FormData) {
  const slug = String(formData.get("slug") ?? "")
  if (!slug) return
  await updateOpportunityFromPreview(slug, "do_not_contact", formData)
  redirect(`/website-preview/${slug}/remove?submitted=1`)
}
