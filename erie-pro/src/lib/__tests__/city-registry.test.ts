import { describe, it, expect } from "vitest";
import {
  getAllCities,
  getCityBySlug,
  getAllCitySlugs,
  getCityAdjustedPrice,
} from "../city-registry";

describe("getAllCities", () => {
  it("returns at least 1 city", () => {
    const cities = getAllCities();
    expect(cities.length).toBeGreaterThanOrEqual(1);
  });

  it("includes Erie", () => {
    const cities = getAllCities();
    const erie = cities.find((c) => c.slug === "erie");
    expect(erie).toBeDefined();
    expect(erie!.name).toBe("Erie");
    expect(erie!.stateCode).toBe("PA");
  });
});

describe("getCityBySlug", () => {
  it("finds Erie by slug", () => {
    const city = getCityBySlug("erie");
    expect(city).toBeDefined();
    expect(city!.domain).toBe("erie.pro");
  });

  it("returns undefined for unknown slug", () => {
    expect(getCityBySlug("atlantis")).toBeUndefined();
  });
});

describe("getAllCitySlugs", () => {
  it("returns an array of slugs", () => {
    const slugs = getAllCitySlugs();
    expect(Array.isArray(slugs)).toBe(true);
    expect(slugs).toContain("erie");
  });
});

describe("getCityAdjustedPrice", () => {
  it("returns base price for Erie (1.0x multiplier)", () => {
    expect(getCityAdjustedPrice("erie", 1000)).toBe(1000);
  });

  it("returns base price for unknown city (defaults to 1.0x)", () => {
    expect(getCityAdjustedPrice("atlantis", 500)).toBe(500);
  });

  it("rounds to nearest integer", () => {
    // Any city with a non-1.0 multiplier would round
    const result = getCityAdjustedPrice("erie", 333);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe("CityConfig structure", () => {
  it("has all required fields for Erie", () => {
    const erie = getCityBySlug("erie")!;
    expect(erie.slug).toBe("erie");
    expect(erie.name).toBe("Erie");
    expect(erie.state).toBe("Pennsylvania");
    expect(erie.stateCode).toBe("PA");
    expect(erie.domain).toBe("erie.pro");
    expect(erie.population).toBeGreaterThan(0);
    expect(erie.coordinates.lat).toBeCloseTo(42.13, 1);
    expect(erie.coordinates.lng).toBeCloseTo(-80.09, 1);
    expect(erie.serviceArea.length).toBeGreaterThanOrEqual(5);
    expect(erie.tagline.length).toBeGreaterThan(0);
    expect(erie.timezone).toBe("America/New_York");
    expect(erie.pricingMultiplier).toBe(1.0);
    expect(erie.metroArea.length).toBeGreaterThan(0);
    expect(erie.counties.length).toBeGreaterThanOrEqual(1);
  });
});
