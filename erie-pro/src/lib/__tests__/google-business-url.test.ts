// erie-pro/src/lib/__tests__/google-business-url.test.ts
import { describe, expect, it } from "vitest"
import {
  buildGoogleBusinessUrlFromPlace,
  buildGoogleBusinessUrlFromPlaceId,
  isGoogleMapsUrl,
} from "@/lib/google-business-url"

describe("google-business-url", () => {
  it("accepts Outscraper location_link", () => {
    const url = "https://www.google.com/maps/place/Acme+Plumbing/@42.1,-80.0,15z"
    expect(
      buildGoogleBusinessUrlFromPlace({
        place_id: "ChIJtest",
        location_link: url,
      }),
    ).toBe(url)
    expect(isGoogleMapsUrl(url)).toBe(true)
  })

  it("falls back to place_id URL", () => {
    expect(buildGoogleBusinessUrlFromPlaceId("ChIJ4zGFAZpYwokRGUGph3Mf37k")).toBe(
      "https://www.google.com/maps/place/?q=place_id:ChIJ4zGFAZpYwokRGUGph3Mf37k",
    )
  })
})
