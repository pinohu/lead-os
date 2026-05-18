// erie-pro/src/lib/__tests__/modifier-segment-aliases.test.ts
import { describe, expect, it } from "vitest"
import {
  buildModifierSegmentAlias,
  resolveModifierFromSegment,
} from "@/lib/modifier-segment-aliases"

describe("modifier-segment-aliases", () => {
  it("builds emergency plumber alias for plumbing", () => {
    expect(buildModifierSegmentAlias("plumbing", "emergency")).toBe("emergency-plumber-erie-pa")
  })

  it("resolves emergency alias back to modifier slug", () => {
    expect(resolveModifierFromSegment("plumbing", "emergency-plumber-erie-pa")).toBe("emergency")
  })

  it("returns null for unknown segments", () => {
    expect(resolveModifierFromSegment("plumbing", "acme-plumbing-llc")).toBeNull()
  })
})
