import { describe, it, expect } from "vitest";
import {
  scoreVideo,
  iso8601DurationToSeconds,
  type VideoCandidate,
} from "@/lib/youtube/score-video";
import type { CurationGuide } from "@/lib/youtube/parse-curation";

const SAMPLE_GUIDE: CurationGuide = {
  clusterName: "plumbing",
  anchorNiche: "plumbing",
  nichesCovered: ["plumbing", "drain-cleaning"],
  sourceChannels: [],
  programmingBlocks: [
    { index: 1, theme: "Foundations", count: "4", examples: "How plumbing works, pipe basics, drain explained" },
    { index: 2, theme: "DIY vs. pro", count: "5", examples: "DIY plumbing fixes, when to call professional plumber" },
  ],
  searchQueries: ["leaking pipe diagnosis"],
  erieFilterIncludes: [],
  erieFilterExcludes: ["Subtropical pest content", "Florida content"],
};

function makeVideo(overrides: Partial<VideoCandidate> = {}): VideoCandidate {
  return {
    videoId: "abc123",
    title: "How plumbing works in your home",
    description:
      "Learn how plumbing works in a typical home. We cover pipes and drains.",
    channelTitle: "This Old House",
    publishedAt: new Date(Date.now() - 180 * 86400 * 1000).toISOString(), // 6 months ago
    durationSec: 8 * 60, // 8 min
    viewCount: 250000,
    likeCount: 8000, // 3.2% like ratio
    commentCount: 400,
    ...overrides,
  };
}

describe("iso8601DurationToSeconds", () => {
  it("parses PT5M32S correctly", () => {
    expect(iso8601DurationToSeconds("PT5M32S")).toBe(332);
  });
  it("parses PT1H2M3S correctly", () => {
    expect(iso8601DurationToSeconds("PT1H2M3S")).toBe(3723);
  });
  it("returns 0 for unparseable", () => {
    expect(iso8601DurationToSeconds("garbage")).toBe(0);
  });
});

describe("scoreVideo", () => {
  it("scores a high-quality, recent, relevant video well", () => {
    const score = scoreVideo(makeVideo(), SAMPLE_GUIDE);
    expect(score.total).toBeGreaterThan(60);
    expect(score.positives.length).toBeGreaterThan(0);
  });

  it("penalizes very old videos", () => {
    const old = makeVideo({
      publishedAt: new Date(Date.now() - 8 * 365 * 86400 * 1000).toISOString(),
    });
    const fresh = makeVideo();
    const sOld = scoreVideo(old, SAMPLE_GUIDE);
    const sFresh = scoreVideo(fresh, SAMPLE_GUIDE);
    expect(sFresh.total).toBeGreaterThan(sOld.total);
    expect(sOld.penalties.some((p) => /years old/.test(p))).toBe(true);
  });

  it("penalizes low engagement", () => {
    const dud = makeVideo({ viewCount: 500, likeCount: 1, commentCount: 0 });
    const score = scoreVideo(dud, SAMPLE_GUIDE);
    expect(score.penalties.some((p) => /low view count/i.test(p))).toBe(true);
    expect(score.engagement).toBeLessThan(5);
  });

  it("penalizes very short videos", () => {
    const tooShort = makeVideo({ durationSec: 30 });
    const score = scoreVideo(tooShort, SAMPLE_GUIDE);
    expect(score.penalties.some((p) => /too short/i.test(p))).toBe(true);
  });

  it("penalizes very long videos", () => {
    const tooLong = makeVideo({ durationSec: 90 * 60 });
    const score = scoreVideo(tooLong, SAMPLE_GUIDE);
    expect(score.penalties.some((p) => /very long/i.test(p))).toBe(true);
  });

  it("rewards videos that match programming blocks", () => {
    const onTopic = makeVideo({
      title: "DIY plumbing fixes — when to call a professional plumber",
      description:
        "DIY plumbing fixes you can handle yourself, and when to call a professional plumber. Learn the difference.",
    });
    const offTopic = makeVideo({
      title: "Random video",
      description: "Nothing about plumbing here",
    });
    const sOn = scoreVideo(onTopic, SAMPLE_GUIDE);
    const sOff = scoreVideo(offTopic, SAMPLE_GUIDE);
    expect(sOn.relevance).toBeGreaterThan(sOff.relevance);
  });

  it("penalizes climate-mismatched content (Florida, Arizona)", () => {
    const wrongClimate = makeVideo({
      title: "Plumbing in Arizona desert homes",
      description: "Drought-resistant plumbing for Phoenix Arizona homes.",
    });
    const correctClimate = makeVideo({
      title: "Cold climate frozen pipe prevention",
      description:
        "Plumbing tips for cold climate winters. Northern homes need pipe insulation against freeze.",
    });
    const sBad = scoreVideo(wrongClimate, SAMPLE_GUIDE);
    const sGood = scoreVideo(correctClimate, SAMPLE_GUIDE);
    expect(sGood.erieFilter).toBeGreaterThan(sBad.erieFilter);
  });

  it("clamps to 0 even if Erie filter is heavily negative", () => {
    const veryBad = makeVideo({
      title: "Arizona Phoenix Florida hurricane plumbing in Miami",
      description:
        "Subtropical drought tolerant palm tree plumbing for Texas and Florida homes.",
      viewCount: 500,
      likeCount: 0,
      durationSec: 20,
      publishedAt: new Date(Date.now() - 10 * 365 * 86400 * 1000).toISOString(),
    });
    const score = scoreVideo(veryBad, SAMPLE_GUIDE);
    expect(score.total).toBeGreaterThanOrEqual(0);
  });

  it("returns a complete breakdown structure", () => {
    const score = scoreVideo(makeVideo(), SAMPLE_GUIDE);
    expect(score).toHaveProperty("total");
    expect(score).toHaveProperty("recency");
    expect(score).toHaveProperty("engagement");
    expect(score).toHaveProperty("length");
    expect(score).toHaveProperty("relevance");
    expect(score).toHaveProperty("erieFilter");
    expect(Array.isArray(score.positives)).toBe(true);
    expect(Array.isArray(score.penalties)).toBe(true);
  });
});
