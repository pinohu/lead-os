import { describe, it, expect } from "vitest";
import {
  parseCandidatesReport,
  buildSeedConfig,
} from "@/lib/viloud/parse-candidates";

const SAMPLE_REPORT = `# Plumbing TV — YouTube Vetting Report

Generated: 2026-05-17T00:00:00.000Z
Niches covered: 4

---

## Top 3 candidates

### 1. How plumbing works  —  88.5/100
... details ...

---

## Full ranked list

| Rank | Score | Title | Channel | Source |
|---:|---:|---|---|---|
| 1 | 88.5 | [How plumbing works](https://www.youtube.com/watch?v=abc12345DEF) | This Old House | channel @thisoldhouse |
| 2 | 82.3 | [Frozen pipe prevention](https://www.youtube.com/watch?v=xyz9876UVW) | Got2Learn | channel @got2learn |
| 3 | 75.1 | [DIY toilet repair](https://www.youtube.com/watch?v=def54321XYZ) | Roger Wakefield | search "toilet repair" |
| 4 | 28.0 | [Low score example](https://www.youtube.com/watch?v=lowscore111) | Random | channel @random |
`;

describe("parseCandidatesReport", () => {
  it("extracts video IDs from the ranked table", () => {
    const candidates = parseCandidatesReport(SAMPLE_REPORT);
    expect(candidates.length).toBe(4);
    expect(candidates[0].youtubeId).toBe("abc12345DEF");
    expect(candidates[0].score).toBe(88.5);
    expect(candidates[0].title).toBe("How plumbing works");
    expect(candidates[1].youtubeId).toBe("xyz9876UVW");
  });

  it("preserves rank ordering", () => {
    const candidates = parseCandidatesReport(SAMPLE_REPORT);
    expect(candidates.map((c) => c.rank)).toEqual([1, 2, 3, 4]);
  });

  it("returns empty array when no Full ranked list section", () => {
    const result = parseCandidatesReport("# Just a header\n\n## Other section\n");
    expect(result).toEqual([]);
  });

  it("returns empty array on empty input", () => {
    expect(parseCandidatesReport("")).toEqual([]);
  });
});

describe("buildSeedConfig", () => {
  it("filters candidates below minScore", () => {
    const candidates = parseCandidatesReport(SAMPLE_REPORT);
    const seed = buildSeedConfig(
      "plumbing",
      "Erie Plumbing TV",
      "Plumbing for Erie",
      ["plumbing"],
      candidates,
      30,
      35 // minScore
    );
    expect(seed.videos.length).toBe(3); // excludes the rank-4 with score 28
    expect(seed.videos.map((v) => v.youtubeId)).toEqual([
      "abc12345DEF",
      "xyz9876UVW",
      "def54321XYZ",
    ]);
  });

  it("respects topN limit", () => {
    const candidates = parseCandidatesReport(SAMPLE_REPORT);
    const seed = buildSeedConfig(
      "plumbing",
      "Erie Plumbing TV",
      "Plumbing for Erie",
      ["plumbing"],
      candidates,
      2, // topN
      0
    );
    expect(seed.videos.length).toBe(2);
  });

  it("includes score + rank + channel in notes", () => {
    const candidates = parseCandidatesReport(SAMPLE_REPORT);
    const seed = buildSeedConfig(
      "plumbing",
      "Erie Plumbing TV",
      "test desc",
      ["plumbing"],
      candidates
    );
    expect(seed.videos[0].notes).toContain("88.5");
    expect(seed.videos[0].notes).toContain("rank #1");
    expect(seed.videos[0].notes).toContain("This Old House");
  });
});
