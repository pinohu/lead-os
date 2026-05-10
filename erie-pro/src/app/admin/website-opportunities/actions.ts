"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { prisma } from "@/lib/db"
import {
  websiteOpportunityStatuses,
  type WebsiteOpportunityStatus,
} from "@/lib/website-opportunities"

function isStatus(value: string): value is WebsiteOpportunityStatus {
  return websiteOpportunityStatuses.includes(value as WebsiteOpportunityStatus)
}

async function assertAdminKeyCookie() {
  const adminKey = process.env.ADMIN_ACCESS_KEY
  if (!adminKey) throw new Error("Admin access is not configured.")

  const cookieStore = await cookies()
  if (cookieStore.get("erie_admin_key")?.value !== adminKey) {
    throw new Error("Unauthorized")
  }
}

export async function updateWebsiteOpportunity(formData: FormData) {
  await assertAdminKeyCookie()

  const id = String(formData.get("id") ?? "")
  const status = String(formData.get("status") ?? "")
  const packageKey = String(formData.get("packageKey") ?? "starter-presence")
  const note = String(formData.get("note") ?? "").trim()

  if (!id || !isStatus(status)) return

  const timestampField =
    status === "preview_created"
      ? ", preview_created_at = COALESCE(preview_created_at, now())"
      : status === "contacted"
        ? ", last_contacted_at = now()"
        : status === "claimed"
          ? ", claimed_at = COALESCE(claimed_at, now())"
          : status === "sold"
            ? ", sold_at = COALESCE(sold_at, now())"
            : status === "declined" || status === "do_not_contact"
              ? ", declined_at = COALESCE(declined_at, now())"
              : ""

  const logEntry = note
    ? JSON.stringify([{ at: new Date().toISOString(), status, note }])
    : JSON.stringify([])

  await prisma.$executeRawUnsafe(
    `
      UPDATE website_opportunities
      SET status = $1,
          package_key = $2,
          contact_log = contact_log || $3::jsonb,
          updated_at = now()
          ${timestampField}
      WHERE id = $4
    `,
    status,
    packageKey,
    logEntry,
    id
  )

  revalidatePath("/admin/website-opportunities")
}
