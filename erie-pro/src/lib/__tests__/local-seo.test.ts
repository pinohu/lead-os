// Local SEO data coverage. Default test run is for CITY_SLUG=erie so
// we verify the active dataset is Erie, and exercise the Meadville
// lookup via getLocalSeoForCity.

import { describe, it, expect } from "vitest";
import {
  ERIE_LOCAL_SEO,
  MEADVILLE_LOCAL_SEO,
  WARREN_LOCAL_SEO,
  JAMESTOWN_LOCAL_SEO,
  ASHTABULA_LOCAL_SEO,
  getLocalSeoForCity,
  getLocalMetaDescription,
  getLocalContext,
  getNeighborhoodList,
  getZipCodes,
  localSeo,
} from "../local-seo";

describe("ERIE_LOCAL_SEO", () => {
  it("has Erie basics wired up", () => {
    expect(ERIE_LOCAL_SEO.city).toBe("Erie");
    expect(ERIE_LOCAL_SEO.stateCode).toBe("PA");
    expect(ERIE_LOCAL_SEO.countyName).toBe("Erie County");
    expect(ERIE_LOCAL_SEO.zipCodes.length).toBeGreaterThanOrEqual(20);
    expect(ERIE_LOCAL_SEO.population).toBe(95000);
  });
});

describe("MEADVILLE_LOCAL_SEO", () => {
  it("has Meadville basics wired up", () => {
    expect(MEADVILLE_LOCAL_SEO.city).toBe("Meadville");
    expect(MEADVILLE_LOCAL_SEO.stateCode).toBe("PA");
    expect(MEADVILLE_LOCAL_SEO.countyName).toBe("Crawford County");
    expect(MEADVILLE_LOCAL_SEO.population).toBe(13000);
  });

  it("has meaningfully different copy from Erie (not lake-effect belt)", () => {
    expect(MEADVILLE_LOCAL_SEO.annualSnowfall).not.toBe(
      ERIE_LOCAL_SEO.annualSnowfall,
    );
    // Meadville gets ~70in, Erie gets ~100in
    expect(MEADVILLE_LOCAL_SEO.annualSnowfall).toMatch(/70/);
    expect(MEADVILLE_LOCAL_SEO.neighborhoods).toContain("Downtown Meadville");
  });

  it("includes Allegheny College as a landmark", () => {
    expect(MEADVILLE_LOCAL_SEO.landmarks).toContain("Allegheny College");
  });
});

describe("WARREN_LOCAL_SEO", () => {
  it("has Warren basics wired up", () => {
    expect(WARREN_LOCAL_SEO.city).toBe("Warren");
    expect(WARREN_LOCAL_SEO.stateCode).toBe("PA");
    expect(WARREN_LOCAL_SEO.countyName).toBe("Warren County");
    expect(WARREN_LOCAL_SEO.population).toBe(9400);
  });

  it("references the Allegheny National Forest in landmarks", () => {
    expect(WARREN_LOCAL_SEO.landmarks).toContain("Allegheny National Forest");
  });
});

describe("JAMESTOWN_LOCAL_SEO", () => {
  it("has Jamestown basics wired up", () => {
    expect(JAMESTOWN_LOCAL_SEO.city).toBe("Jamestown");
    expect(JAMESTOWN_LOCAL_SEO.stateCode).toBe("NY");
    expect(JAMESTOWN_LOCAL_SEO.countyName).toBe("Chautauqua County");
    expect(JAMESTOWN_LOCAL_SEO.population).toBe(29000);
  });

  it("references the National Comedy Center in landmarks", () => {
    expect(JAMESTOWN_LOCAL_SEO.landmarks).toContain("National Comedy Center");
  });

  it("has distinctly NY-flavored copy (not PA lake-effect belt)", () => {
    expect(JAMESTOWN_LOCAL_SEO.state).toBe("New York");
    expect(JAMESTOWN_LOCAL_SEO.neighborhoods).toContain("Downtown Jamestown");
    expect(JAMESTOWN_LOCAL_SEO.neighborhoods).toContain("Lakewood");
  });
});

describe("ASHTABULA_LOCAL_SEO", () => {
  it("has Ashtabula basics wired up", () => {
    expect(ASHTABULA_LOCAL_SEO.city).toBe("Ashtabula");
    expect(ASHTABULA_LOCAL_SEO.stateCode).toBe("OH");
    expect(ASHTABULA_LOCAL_SEO.countyName).toBe("Ashtabula County");
    expect(ASHTABULA_LOCAL_SEO.population).toBe(18000);
  });

  it("references coastal Lake Erie landmarks", () => {
    expect(ASHTABULA_LOCAL_SEO.landmarks).toContain("Ashtabula Harbor");
    expect(ASHTABULA_LOCAL_SEO.landmarks).toContain("Ashtabula Lift Bridge");
  });

  it("gets heavier lake-effect snow than Warren (coast vs plateau)", () => {
    // Ashtabula is on the lake shoreline like Erie, so snowfall
    // should match Erie's belt, not Warren's 80in.
    expect(ASHTABULA_LOCAL_SEO.annualSnowfall).toMatch(/110/);
  });
});

describe("getLocalSeoForCity", () => {
  it("resolves erie", () => {
    expect(getLocalSeoForCity("erie")).toBe(ERIE_LOCAL_SEO);
  });

  it("resolves meadville", () => {
    expect(getLocalSeoForCity("meadville")).toBe(MEADVILLE_LOCAL_SEO);
  });

  it("resolves warren", () => {
    expect(getLocalSeoForCity("warren")).toBe(WARREN_LOCAL_SEO);
  });

  it("resolves jamestown", () => {
    expect(getLocalSeoForCity("jamestown")).toBe(JAMESTOWN_LOCAL_SEO);
  });

  it("resolves ashtabula", () => {
    expect(getLocalSeoForCity("ashtabula")).toBe(ASHTABULA_LOCAL_SEO);
  });

  it("returns undefined for an unknown slug", () => {
    expect(getLocalSeoForCity("atlantis")).toBeUndefined();
  });
});

describe("active localSeo (CITY_SLUG=erie by default)", () => {
  it("matches Erie dataset when no CITY_SLUG override is set", () => {
    expect(localSeo.city).toBe("Erie");
    expect(localSeo.stateCode).toBe("PA");
  });
});

describe("getLocalContext", () => {
  it("mentions the active city name in home-service copy", () => {
    const ctx = getLocalContext("plumbing");
    expect(ctx).toMatch(/Erie/);
    expect(ctx).not.toMatch(/undefined/);
  });
});

describe("getLocalMetaDescription", () => {
  it("includes the active city and stateCode", () => {
    const desc = getLocalMetaDescription("plumbing");
    expect(desc).toMatch(/Erie/);
    expect(desc).toMatch(/PA/);
  });
});

describe("getNeighborhoodList / getZipCodes", () => {
  it("returns clones (not the internal array)", () => {
    const list = getNeighborhoodList();
    const zips = getZipCodes();
    expect(list).not.toBe(localSeo.neighborhoods);
    expect(zips).not.toBe(localSeo.zipCodes);
    expect(list).toEqual(localSeo.neighborhoods);
    expect(zips).toEqual(localSeo.zipCodes);
  });
});
