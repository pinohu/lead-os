import { describe, it, expect } from "vitest";
import {
  validateCityConfig,
  normalizeCityConfig,
  findCoverageOverlaps,
  findCityByZip,
  findRegistryConflicts,
  evaluateRegistryHealth,
} from "@/lib/city-helpers";
import type { CityConfig } from "@/lib/city-registry";

function makeCity(overrides: Partial<CityConfig> = {}): CityConfig {
  return {
    slug: "test-city",
    name: "Test City",
    state: "Pennsylvania",
    stateCode: "PA",
    domain: "test.pro",
    population: 50000,
    coordinates: { lat: 42.0, lng: -80.0 },
    serviceArea: ["Test", "Test Township"],
    tagline: "Test tagline",
    timezone: "America/New_York",
    pricingMultiplier: 1.0,
    metroArea: "Test Metro",
    counties: ["Test County"],
    coverageZips: ["12345", "12346"],
    overlapAreas: [],
    pilotCategories: ["plumbing", "hvac"],
    ...overrides,
  };
}

describe("validateCityConfig — happy path", () => {
  it("returns ok=true for a complete healthy config", () => {
    const result = validateCityConfig(makeCity());
    expect(result.ok).toBe(true);
    expect(result.issues.filter((i) => i.severity === "error")).toEqual([]);
  });
});

describe("validateCityConfig — slug", () => {
  it("rejects empty slug", () => {
    const result = validateCityConfig(makeCity({ slug: "" }));
    expect(result.ok).toBe(false);
    expect(result.issues.find((i) => i.field === "slug")).toBeDefined();
  });

  it("rejects uppercase slug", () => {
    const result = validateCityConfig(makeCity({ slug: "BAD_SLUG" }));
    expect(result.ok).toBe(false);
  });

  it("rejects slug starting with digit", () => {
    expect(validateCityConfig(makeCity({ slug: "1city" })).ok).toBe(false);
  });

  it("accepts hyphenated slug", () => {
    expect(validateCityConfig(makeCity({ slug: "north-east" })).ok).toBe(true);
  });
});

describe("validateCityConfig — state + domain", () => {
  it("rejects malformed state code", () => {
    expect(validateCityConfig(makeCity({ stateCode: "Pennsylvania" })).ok).toBe(false);
    expect(validateCityConfig(makeCity({ stateCode: "p" })).ok).toBe(false);
  });

  it("rejects malformed domain", () => {
    expect(validateCityConfig(makeCity({ domain: "not a domain" })).ok).toBe(false);
    expect(validateCityConfig(makeCity({ domain: "missing-tld" })).ok).toBe(false);
  });
});

describe("validateCityConfig — coordinates", () => {
  it("rejects out-of-range lat/lng", () => {
    expect(validateCityConfig(makeCity({ coordinates: { lat: 100, lng: 0 } })).ok).toBe(false);
    expect(validateCityConfig(makeCity({ coordinates: { lat: 0, lng: 200 } })).ok).toBe(false);
  });

  it("warns (not errors) for coordinates outside continental US", () => {
    const result = validateCityConfig(
      makeCity({ coordinates: { lat: 0, lng: 0 } }) // off Africa coast
    );
    expect(result.ok).toBe(true); // no errors
    expect(result.issues.some((i) => i.severity === "warning" && i.field === "coordinates")).toBe(true);
  });
});

describe("validateCityConfig — ZIPs", () => {
  it("rejects malformed coverageZips", () => {
    expect(validateCityConfig(makeCity({ coverageZips: ["1234", "12345"] })).ok).toBe(false);
    expect(validateCityConfig(makeCity({ coverageZips: ["abcde"] })).ok).toBe(false);
  });

  it("warns on duplicate ZIPs", () => {
    const result = validateCityConfig(
      makeCity({ coverageZips: ["12345", "12345", "12346"] })
    );
    expect(result.ok).toBe(true); // dupes are warning, not error
    expect(result.issues.some((i) => i.severity === "warning" && /duplicate/i.test(i.message))).toBe(true);
  });
});

describe("validateCityConfig — overlap areas", () => {
  it("validates each overlap entry", () => {
    const result = validateCityConfig(
      makeCity({ overlapAreas: [{ city: "Test", stateCode: "pa", zip: "12345" }] }) // lowercase state
    );
    expect(result.ok).toBe(false);
  });
});

describe("validateCityConfig — pricing", () => {
  it("rejects zero / negative multiplier", () => {
    expect(validateCityConfig(makeCity({ pricingMultiplier: 0 })).ok).toBe(false);
    expect(validateCityConfig(makeCity({ pricingMultiplier: -1 })).ok).toBe(false);
  });

  it("warns on extreme values", () => {
    const result = validateCityConfig(makeCity({ pricingMultiplier: 3 }));
    expect(result.ok).toBe(true);
    expect(result.issues.some((i) => i.field === "pricingMultiplier")).toBe(true);
  });
});

describe("normalizeCityConfig", () => {
  it("defaults coverageZips / overlapAreas / pilotCategories to []", () => {
    const slim = makeCity();
    delete (slim as { coverageZips?: string[] }).coverageZips;
    delete (slim as { overlapAreas?: object[] }).overlapAreas;
    delete (slim as { pilotCategories?: string[] }).pilotCategories;
    const norm = normalizeCityConfig(slim);
    expect(norm.coverageZips).toEqual([]);
    expect(norm.overlapAreas).toEqual([]);
    expect(norm.pilotCategories).toEqual([]);
  });

  it("preserves provided arrays", () => {
    const c = makeCity({ coverageZips: ["12345"] });
    const norm = normalizeCityConfig(c);
    expect(norm.coverageZips).toEqual(["12345"]);
  });
});

describe("findCoverageOverlaps", () => {
  it("flags ZIPs present in multiple cities' coverageZips", () => {
    const cities = [
      makeCity({ slug: "city-a", coverageZips: ["10001", "10002"] }),
      makeCity({ slug: "city-b", coverageZips: ["10002", "10003"] }),
    ];
    const overlaps = findCoverageOverlaps(cities);
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0].zip).toBe("10002");
    expect(overlaps[0].cities).toEqual(["city-a", "city-b"]);
  });

  it("returns empty when no overlaps", () => {
    const cities = [
      makeCity({ slug: "city-a", coverageZips: ["10001"] }),
      makeCity({ slug: "city-b", coverageZips: ["10002"] }),
    ];
    expect(findCoverageOverlaps(cities)).toEqual([]);
  });
});

describe("findCityByZip", () => {
  const cities = [
    makeCity({ slug: "erie", coverageZips: ["16501", "16502"] }),
    makeCity({ slug: "meadville", coverageZips: ["16335"] }),
  ];

  it("returns the city containing the ZIP", () => {
    expect(findCityByZip(cities, "16501")?.slug).toBe("erie");
    expect(findCityByZip(cities, "16335")?.slug).toBe("meadville");
  });

  it("returns null when no city serves the ZIP", () => {
    expect(findCityByZip(cities, "99999")).toBeNull();
  });

  it("returns null for malformed ZIPs", () => {
    expect(findCityByZip(cities, "abc")).toBeNull();
    expect(findCityByZip(cities, "1234")).toBeNull();
  });
});

describe("findRegistryConflicts", () => {
  it("flags duplicate domains", () => {
    const cities = [
      makeCity({ slug: "city-a", domain: "shared.pro" }),
      makeCity({ slug: "city-b", domain: "shared.pro" }),
    ];
    const conflicts = findRegistryConflicts(cities);
    expect(conflicts.find((c) => c.type === "duplicate_domain" && c.value === "shared.pro")).toBeDefined();
  });

  it("returns empty for healthy registry", () => {
    const cities = [
      makeCity({ slug: "city-a", domain: "a.pro" }),
      makeCity({ slug: "city-b", domain: "b.pro" }),
    ];
    expect(findRegistryConflicts(cities)).toEqual([]);
  });
});

describe("evaluateRegistryHealth", () => {
  it("rolls up per-city and registry-wide checks", () => {
    const cities = [
      makeCity({ slug: "good", coverageZips: ["10001"] }),
      makeCity({ slug: "bad", domain: "bad" /* invalid */ , coverageZips: ["10001"] }),
    ];
    const report = evaluateRegistryHealth(cities);
    expect(report.totalCities).toBe(2);
    expect(report.citiesWithErrors).toBeGreaterThan(0);
    expect(report.coverageOverlaps.length).toBeGreaterThan(0); // ZIP overlap
  });
});
