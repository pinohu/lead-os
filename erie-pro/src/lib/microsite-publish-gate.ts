// erie-pro/src/lib/microsite-publish-gate.ts
// Trust-but-verify: data quality gate before public publish.

import type { MicrositePublishMode } from "@/generated/prisma"

export interface MicrositePublishInput {
  businessName?: string | null
  phone?: string | null
  niche?: string | null
  description?: string | null
  addressCity?: string | null
  addressState?: string | null
  verificationStatus?: string | null
  license?: string | null
  hasPublicReviews?: boolean
}

export interface MicrositePublishDecision {
  dataQualityScore: number
  publishMode: MicrositePublishMode
  canAutoPublish: boolean
  blockers: string[]
}

const MIN_AUTO_PUBLISH_SCORE = 0.72

function scoreField(present: boolean, weight: number) {
  return present ? weight : 0
}

export function evaluateMicrositePublish(input: MicrositePublishInput): MicrositePublishDecision {
  const blockers: string[] = []
  let score = 0

  score += scoreField(Boolean(input.businessName?.trim()), 0.2)
  if (!input.businessName?.trim()) blockers.push("missing_business_name")

  score += scoreField(Boolean(input.phone?.trim()), 0.15)
  if (!input.phone?.trim()) blockers.push("missing_phone")

  score += scoreField(Boolean(input.niche?.trim()), 0.1)
  score += scoreField(Boolean(input.description && input.description.length >= 40), 0.15)
  if (!input.description || input.description.length < 40) blockers.push("thin_description")

  score += scoreField(Boolean(input.addressCity && input.addressState), 0.1)
  const verified =
    input.verificationStatus === "verified" ||
    input.verificationStatus === "auto_verified" ||
    input.verificationStatus === "admin_approved"
  score += scoreField(verified, 0.2)
  if (!verified) blockers.push("ownership_unverified")

  score += scoreField(Boolean(input.license?.trim()), 0.05)
  score += scoreField(Boolean(input.hasPublicReviews), 0.05)

  const rounded = Math.round(score * 100) / 100
  const canAutoPublish = rounded >= MIN_AUTO_PUBLISH_SCORE && blockers.length === 0

  let publishMode: MicrositePublishMode = "draft"
  if (canAutoPublish) publishMode = "auto_eligible"
  else if (rounded >= 0.45) publishMode = "review_required"

  return {
    dataQualityScore: rounded,
    publishMode,
    canAutoPublish,
    blockers,
  }
}
