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

  it("Erie has Launch Kit fields wired up", () => {
    const erie = getCityBySlug("erie")!;
    expect(erie.tagline).toBe("One pro. No bidding. Always Erie.");
    expect(erie.coverageZips?.length ?? 0).toBeGreaterThanOrEqual(20);
    expect(erie.overlapAreas?.length ?? 0).toBeGreaterThanOrEqual(1);
    expect(erie.pilotCategories?.length ?? 0).toBeGreaterThanOrEqual(3);
  });
});

describe("Meadville expansion city", () => {
  it("resolves from the registry", () => {
    const meadville = getCityBySlug("meadville");
    expect(meadville).toBeDefined();
    expect(meadville!.stateCode).toBe("PA");
    expect(meadville!.domain).toBe("meadville.pro");
    expect(meadville!.pricingMultiplier).toBeLessThan(1.0);
  });

  it("applies its pricing multiplier", () => {
    // 1000 × 0.7 = 700
    expect(getCityAdjustedPrice("meadville", 1000)).toBe(700);
  });

  it("is listed in the city slugs", () => {
    const slugs = getAllCitySlugs();
    expect(slugs).toContain("erie");
    expect(slugs).toContain("meadville");
  });
});

describe("Warren expansion city", () => {
  it("resolves from the registry", () => {
    const warren = getCityBySlug("warren");
    expect(warren).toBeDefined();
    expect(warren!.stateCode).toBe("PA");
    expect(warren!.domain).toBe("warren.pro");
    expect(warren!.pricingMultiplier).toBe(0.65);
    expect(warren!.counties).toContain("Warren County");
  });

  it("applies its pricing multiplier (smaller market)", () => {
    // 1000 × 0.65 = 650
    expect(getCityAdjustedPrice("warren", 1000)).toBe(650);
  });

  it("appears in the city slugs list alongside Erie and Meadville", () => {
    const slugs = getAllCitySlugs();
    expect(slugs).toContain("warren");
    expect(slugs).toContain("meadville");
    expect(slugs).toContain("erie");
  });

  it("has Launch Kit fields wired up", () => {
    const warren = getCityBySlug("warren")!;
    expect(warren.coverageZips?.length ?? 0).toBeGreaterThanOrEqual(5);
    expect(warren.pilotCategories?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(warren.tagline).toMatch(/Warren/);
  });
});
