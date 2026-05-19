// erie-pro/src/lib/__tests__/page-audience-registry.test.ts
import { describe, expect, it } from "vitest"
import {
  isProviderProfilePath,
  resolveAudienceFromPathname,
} from "@/lib/page-audience-registry"
import { shouldShowProviderSalesBlock } from "@/lib/audience-context"

describe("resolveAudienceFromPathname", () => {
  it("treats homepage as consumer", () => {
    expect(resolveAudienceFromPathname("/").audience).toBe("consumer")
  })

  it("treats provider profile as consumer with footer claim utility", () => {
    const config = resolveAudienceFromPathname("/plumbing/joes-plumbing")
    expect(config.audience).toBe("consumer")
    expect(config.allowProviderCTA).toBe("footer-utility")
  })

  it("treats for-business as provider", () => {
    expect(resolveAudienceFromPathname("/for-business/claim").audience).toBe("provider")
    expect(shouldShowProviderSalesBlock("provider")).toBe(true)
  })

  it("treats dashboard as provider", () => {
    expect(resolveAudienceFromPathname("/dashboard/leads").audience).toBe("provider")
  })

  it("treats admin as admin", () => {
    expect(resolveAudienceFromPathname("/admin/providers").audience).toBe("admin")
  })
})

describe("isProviderProfilePath", () => {
  it("detects niche provider slugs", () => {
    expect(isProviderProfilePath("/hvac/acme-heating")).toBe(true)
  })

  it("excludes reserved top-level routes", () => {
    expect(isProviderProfilePath("/directory")).toBe(false)
    expect(isProviderProfilePath("/for-business/claim")).toBe(false)
  })
})
