// erie-pro/src/lib/__tests__/seo-publish-gate.test.ts
import { describe, expect, it, beforeEach, afterEach } from "vitest"
import {
  shouldNoindexAreaMatrixPage,
  shouldNoindexModifierPage,
  shouldNoindexNichePage,
  shouldNoindexPath,
} from "@/lib/seo-publish-gate"

describe("seo-publish-gate", () => {
  const env = { ...process.env }

  beforeEach(() => {
    process.env.SEO_PUBLISH_GATE = "1"
    process.env.SEO_PILOT_INDEX_OVERRIDE = "1"
  })

  afterEach(() => {
    process.env = { ...env }
  })

  it("allows pilot core pages while gate is on", () => {
    expect(shouldNoindexNichePage("plumbing", "core")).toBe(false)
    expect(shouldNoindexPath("/plumbing/pricing")).toBe(false)
  })

  it("noindexes non-pilot blog pages when gate is on", () => {
    expect(shouldNoindexNichePage("accounting", "blog")).toBe(true)
  })

  it("is disabled when SEO_PUBLISH_GATE is off", () => {
    process.env.SEO_PUBLISH_GATE = "0"
    expect(shouldNoindexNichePage("accounting", "blog")).toBe(false)
  })

  it("allows pilot area matrix pages when gate is on", () => {
    expect(shouldNoindexAreaMatrixPage("plumbing", "erie")).toBe(false)
    expect(shouldNoindexPath("/areas/erie/plumbing")).toBe(false)
    expect(shouldNoindexPath("/plumbing/areas/erie")).toBe(false)
  })

  it("allows pilot modifier pages when gate is on", () => {
    expect(shouldNoindexModifierPage("plumbing")).toBe(false)
    expect(shouldNoindexPath("/plumbing/modifiers/emergency")).toBe(false)
  })

  it("noindexes non-pilot modifier pages when gate is on", () => {
    expect(shouldNoindexModifierPage("accounting")).toBe(true)
  })
})
