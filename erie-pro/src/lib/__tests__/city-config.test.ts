import { describe, it, expect } from "vitest";
import { cityConfig } from "../city-config";

describe("cityConfig", () => {
  it("is defined and has a slug", () => {
    expect(cityConfig).toBeDefined();
    expect(cityConfig.slug).toBeTruthy();
  });

  it("defaults to Erie when CITY_SLUG is not set", () => {
    // Default env has no CITY_SLUG override
    expect(cityConfig.slug).toBe("erie");
    expect(cityConfig.name).toBe("Erie");
    expect(cityConfig.domain).toBe("erie.pro");
  });

  it("has all required CityConfig fields", () => {
    expect(cityConfig.slug).toBeTruthy();
    expect(cityConfig.name).toBeTruthy();
    expect(cityConfig.state).toBeTruthy();
    expect(cityConfig.stateCode).toHaveLength(2);
    expect(cityConfig.domain).toContain(".");
    expect(cityConfig.population).toBeGreaterThan(0);
    expect(cityConfig.coordinates.lat).toBeTruthy();
    expect(cityConfig.coordinates.lng).toBeTruthy();
    expect(cityConfig.serviceArea.length).toBeGreaterThan(0);
    expect(cityConfig.tagline).toBeTruthy();
    expect(cityConfig.timezone).toBeTruthy();
    expect(cityConfig.pricingMultiplier).toBeGreaterThan(0);
    expect(cityConfig.metroArea).toBeTruthy();
    expect(cityConfig.counties.length).toBeGreaterThan(0);
  });
});
