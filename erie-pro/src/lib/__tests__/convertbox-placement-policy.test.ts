import { describe, expect, it } from "vitest"
import { isConvertBoxBlockedPath, shouldLoadConvertBox } from "../convertbox-placement-policy"

describe("convertbox-placement-policy", () => {
  it("blocks auth and admin paths documented in excludeTargets", () => {
    for (const path of [
      "/login",
      "/login?callbackUrl=/dashboard",
      "/dashboard",
      "/dashboard/leads",
      "/admin",
      "/admin/leads",
      "/provider/dashboard",
      "/privacy",
      "/terms",
      "/manage-data",
      "/for-business/checkout",
    ]) {
      expect(isConvertBoxBlockedPath(path)).toBe(true)
      expect(shouldLoadConvertBox(path)).toBe(false)
    }
  })

  it("allows public marketing and lead paths", () => {
    for (const path of ["/", "/get-matched", "/plumbing/pricing", "/pros", "/contact"]) {
      expect(isConvertBoxBlockedPath(path)).toBe(false)
    }
  })

  it("respects NEXT_PUBLIC_CONVERTBOX_ENABLED=false", () => {
    const prev = process.env.NEXT_PUBLIC_CONVERTBOX_ENABLED
    process.env.NEXT_PUBLIC_CONVERTBOX_ENABLED = "false"
    expect(shouldLoadConvertBox("/get-matched")).toBe(false)
    process.env.NEXT_PUBLIC_CONVERTBOX_ENABLED = prev
  })
})
