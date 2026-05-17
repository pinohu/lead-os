import { describe, it, expect } from "vitest";
import { parseCurationGuide } from "@/lib/youtube/parse-curation";

const SAMPLE_GUIDE = `# Plumbing TV — Curation Guide

**Cluster:** plumbing
**Anchor niche:** \`plumbing\`
**Embed locations:** plumbing page + cousins

## Niches covered

- \`plumbing\` (anchor)
- \`drain-cleaning\`
- \`sewer-line-repair\`
- \`water-heater-services\`

## Recommended source channels

| Channel | YouTube handle / URL | Why it's good | Best for |
|---|---|---|---|
| Roger Wakefield | [@RogerWakefieldLicensedPlumber](https://www.youtube.com/@RogerWakefieldLicensedPlumber) | Licensed plumber with great DIY/pro content | Plumbing |
| This Old House | [@thisoldhouse](https://www.youtube.com/@thisoldhouse) | Polished install content | All plumbing |
| Got2Learn | [@got2learn](https://www.youtube.com/@got2learn) | Step-by-step plumbing how-to | Plumbing |

## Programming structure

| Block | Theme | Count | Examples |
|---|---|---|---|
| 1 | Foundations & what's involved | 4 | "How plumbing works", "Drain basics" |
| 2 | DIY vs. pro | 5 | "DIY plumbing fixes", "When to call a pro" |
| 3 | What good work looks like | 4 | "Inside a repipe", "Watch a sewer scope" |

## Search queries

- \`leaking pipe diagnosis\` — block 1
- \`toilet repair homeowner\` — block 2

## Erie-specific filter

Erie plumbing content needs to address:

- **Freeze damage** — frozen pipes are a real Erie concern
- **Sump pumps** — high water table

Skip:

- Subtropical content (Florida, Texas, Arizona)
- Hurricane plumbing emergencies
`;

describe("parseCurationGuide", () => {
  it("extracts the cluster slug", () => {
    const g = parseCurationGuide(SAMPLE_GUIDE);
    expect(g.clusterName).toBe("plumbing");
  });

  it("extracts the anchor niche", () => {
    const g = parseCurationGuide(SAMPLE_GUIDE);
    expect(g.anchorNiche).toBe("plumbing");
  });

  it("extracts all niches covered", () => {
    const g = parseCurationGuide(SAMPLE_GUIDE);
    expect(g.nichesCovered).toContain("plumbing");
    expect(g.nichesCovered).toContain("drain-cleaning");
    expect(g.nichesCovered).toContain("sewer-line-repair");
    expect(g.nichesCovered).toContain("water-heater-services");
  });

  it("extracts source channels with handles", () => {
    const g = parseCurationGuide(SAMPLE_GUIDE);
    expect(g.sourceChannels.length).toBeGreaterThanOrEqual(3);
    const roger = g.sourceChannels.find((c) =>
      c.name.includes("Roger Wakefield")
    );
    expect(roger).toBeDefined();
    expect(roger!.handle).toBe("@RogerWakefieldLicensedPlumber");
    expect(roger!.url).toMatch(/youtube\.com/);
    const toh = g.sourceChannels.find((c) =>
      c.name.includes("This Old House")
    );
    expect(toh?.handle).toBe("@thisoldhouse");
  });

  it("extracts programming blocks with numeric index", () => {
    const g = parseCurationGuide(SAMPLE_GUIDE);
    expect(g.programmingBlocks.length).toBe(3);
    expect(g.programmingBlocks[0].index).toBe(1);
    expect(g.programmingBlocks[0].theme).toContain("Foundations");
    expect(g.programmingBlocks[1].theme).toContain("DIY");
  });

  it("extracts search queries from backticked bullets", () => {
    const g = parseCurationGuide(SAMPLE_GUIDE);
    expect(g.searchQueries).toContain("leaking pipe diagnosis");
    expect(g.searchQueries).toContain("toilet repair homeowner");
  });

  it("extracts Erie filter excludes from the Skip section", () => {
    const g = parseCurationGuide(SAMPLE_GUIDE);
    expect(g.erieFilterExcludes.length).toBeGreaterThan(0);
    expect(
      g.erieFilterExcludes.some((s) =>
        /(florida|texas|arizona|hurricane|subtropical)/i.test(s)
      )
    ).toBe(true);
  });

  it("handles a missing recommended-channels section gracefully", () => {
    const partial = `# Test\n\n**Anchor niche:** \`test\`\n\n## Niches covered\n\n- \`test\`\n`;
    const g = parseCurationGuide(partial);
    expect(g.sourceChannels).toEqual([]);
    expect(g.programmingBlocks).toEqual([]);
    expect(g.searchQueries).toEqual([]);
  });
});
