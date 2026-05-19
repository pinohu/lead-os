import { describe, expect, it } from "vitest"
import { containsBannedClaim, PROVIDER_OFFER_DISCLAIMERS } from "@/lib/provider-offer-compliance"
import { evaluateMicrositePublish } from "@/lib/microsite-publish-gate"
import { PROVIDER_OFFER_PLANS } from "@/lib/provider-offer-plans"

describe("provider-offer-compliance", () => {
  it("flags guaranteed outcome language", () => {
    expect(containsBannedClaim("We guarantee 50 leads per month")).toBe(true)
    expect(containsBannedClaim("Structured microsite for Erie County")).toBe(false)
  })

  it("includes lead routing disclaimer", () => {
    expect(PROVIDER_OFFER_DISCLAIMERS.leads).toMatch(/vary/i)
  })
})

describe("microsite-publish-gate", () => {
  it("requires verification for auto publish", () => {
    const decision = evaluateMicrositePublish({
      businessName: "Acme Plumbing",
      phone: "8145551212",
      niche: "plumbing",
      description: "Licensed plumbing services in Erie County with emergency response.",
      addressCity: "Erie",
      addressState: "PA",
      verificationStatus: "unverified",
    })
    expect(decision.canAutoPublish).toBe(false)
    expect(decision.blockers).toContain("ownership_unverified")
  })
})

describe("provider-offer-plans", () => {
  it("avoids guarantee language in value stack notes", () => {
    for (const plan of PROVIDER_OFFER_PLANS) {
      for (const item of plan.valueStack) {
        expect(containsBannedClaim(item.strategicValueNote)).toBe(false)
      }
    }
  })
})
