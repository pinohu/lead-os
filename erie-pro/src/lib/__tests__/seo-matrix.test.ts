// erie-pro/src/lib/__tests__/seo-matrix.test.ts
import { describe, expect, it, afterEach } from "vitest"
import {
  getAreaNicheStaticParams,
  getMatrixAreaSlugs,
  getMatrixNicheSlugs,
  getModifierStaticParams,
  shouldIndexAreaMatrixPage,
} from "@/lib/seo-matrix"

describe("seo-matrix", () => {
  const env = { ...process.env }

  afterEach(() => {
    process.env = { ...env }
  })

  it("returns pilot niches by default", () => {
    delete process.env.SEO_AREA_MATRIX_MODE
    const slugs = getMatrixNicheSlugs()
    expect(slugs).toContain("plumbing")
    expect(slugs.length).toBeGreaterThan(0)
    expect(slugs.length).toBeLessThan(50)
  })

  it("builds bounded static params for pilot mode", () => {
    delete process.env.SEO_AREA_MATRIX_MODE
    const params = getAreaNicheStaticParams()
    expect(params.length).toBeGreaterThan(0)
    expect(params[0]).toMatchObject({
      area: expect.any(String),
      niche: expect.any(String),
    })
  })

  it("includes municipality areas in pilot mode", () => {
    delete process.env.SEO_AREA_MATRIX_MODE
    const areas = getMatrixAreaSlugs()
    expect(areas).toContain("erie")
    expect(areas).toContain("millcreek")
  })

  it("generates modifier params for pilot niches", () => {
    const params = getModifierStaticParams()
    expect(params.some((row) => row.niche === "plumbing" && row.modifier === "emergency")).toBe(
      true,
    )
  })

  it("respects SEO_AREA_MATRIX_INDEX=0", () => {
    process.env.SEO_AREA_MATRIX_INDEX = "0"
    expect(shouldIndexAreaMatrixPage("plumbing")).toBe(false)
  })

  it("allows indexing when SEO_AREA_MATRIX_INDEX unset", () => {
    delete process.env.SEO_AREA_MATRIX_INDEX
    expect(shouldIndexAreaMatrixPage("plumbing")).toBe(true)
  })
})
