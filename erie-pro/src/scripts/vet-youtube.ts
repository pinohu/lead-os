// ── vet-youtube CLI ──────────────────────────────────────────────────
// Reads a cluster (or single-niche) curation guide, fetches candidate
// videos from each recommended source channel and search query, scores
// them with the Erie filter applied, and writes a ranked markdown
// report to docs/viloud-curation/output/.
//
// Usage:
//   npx tsx src/scripts/vet-youtube.ts --cluster outdoor-seasonal
//   npx tsx src/scripts/vet-youtube.ts --cluster plumbing
//   npx tsx src/scripts/vet-youtube.ts --all
//   npx tsx src/scripts/vet-youtube.ts --cluster plumbing --max-per-channel 30
//
// Requires YOUTUBE_API_KEY in env. Quota usage per cluster: roughly
// 50-150 units (well within the default 10,000/day).

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { resolve, join } from "path";
import { parseCurationGuide, type CurationGuide } from "@/lib/youtube/parse-curation";
import { scoreVideo, type ScoreBreakdown } from "@/lib/youtube/score-video";
import {
  getChannelCandidates,
  searchVideoIds,
  getVideoMetadata,
} from "@/lib/youtube/client";
import type { VideoCandidate } from "@/lib/youtube/score-video";

interface CliArgs {
  cluster: string | null;
  all: boolean;
  maxPerChannel: number;
  maxPerQuery: number;
  searchTopN: number;
  dryRun: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    cluster: null,
    all: false,
    maxPerChannel: 20,
    maxPerQuery: 10,
    searchTopN: 15,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--cluster") args.cluster = argv[++i] ?? null;
    else if (a === "--all") args.all = true;
    else if (a === "--max-per-channel") args.maxPerChannel = parseInt(argv[++i] ?? "20", 10);
    else if (a === "--max-per-query") args.maxPerQuery = parseInt(argv[++i] ?? "10", 10);
    else if (a === "--top") args.searchTopN = parseInt(argv[++i] ?? "15", 10);
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--help" || a === "-h") {
      console.log(
        [
          "vet-youtube — score candidate videos against a curation guide",
          "",
          "Usage:",
          "  npx tsx src/scripts/vet-youtube.ts --cluster <name>",
          "  npx tsx src/scripts/vet-youtube.ts --all",
          "",
          "Options:",
          "  --cluster <name>          Cluster slug or anchor niche (e.g. plumbing, outdoor-seasonal)",
          "  --all                     Vet every cluster file under docs/viloud-curation/",
          "  --max-per-channel <n>     Recent videos per source channel (default 20)",
          "  --max-per-query <n>       Search results per query (default 10)",
          "  --top <n>                 Top N candidates to surface per cluster (default 15)",
          "  --dry-run                 Parse and plan only; do not call YouTube API",
          "",
          "Env:",
          "  YOUTUBE_API_KEY  required (unless --dry-run)",
        ].join("\n")
      );
      process.exit(0);
    }
  }
  return args;
}

const CURATION_DIR = resolve(process.cwd(), "..", "erie-pro", "docs", "viloud-curation");
const OUTPUT_DIR = resolve(CURATION_DIR, "output");

function findGuideFile(name: string): string | null {
  // Try cluster file first, then plain anchor-niche name
  const candidates = [
    `cluster-${name}.md`,
    `${name}.md`,
  ];
  for (const c of candidates) {
    const path = join(CURATION_DIR, c);
    if (existsSync(path)) return path;
  }
  return null;
}

function listAllGuides(): string[] {
  if (!existsSync(CURATION_DIR)) return [];
  return readdirSync(CURATION_DIR)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .map((f) => join(CURATION_DIR, f));
}

interface ScoredCandidate {
  video: VideoCandidate;
  score: ScoreBreakdown;
  source: string; // "channel @handle" or "search 'query'"
}

async function vetGuide(args: CliArgs, guidePath: string): Promise<void> {
  const md = readFileSync(guidePath, "utf-8");
  const guide = parseCurationGuide(md);
  const basename = guidePath.split("/").pop()!.replace(/\.md$/, "");
  console.log(`\n━━━ Vetting ${basename} ━━━`);
  console.log(`  Niches:   ${guide.nichesCovered.length}`);
  console.log(`  Channels: ${guide.sourceChannels.length}`);
  console.log(`  Queries:  ${guide.searchQueries.length}`);
  console.log(`  Blocks:   ${guide.programmingBlocks.length}`);

  if (args.dryRun) {
    console.log("\n  (dry-run: skipping API calls)");
    return;
  }

  const candidates: ScoredCandidate[] = [];

  // 1. Vet each recommended source channel
  for (const ch of guide.sourceChannels) {
    if (!ch.handle) {
      // Channel without a parseable handle — skip silently; the curator
      // can search manually based on the rationale column.
      continue;
    }
    try {
      console.log(`  ↳ channel ${ch.handle} (${ch.name})...`);
      const result = await getChannelCandidates(ch.handle, args.maxPerChannel);
      if (!result) {
        console.log(`    [not found]`);
        continue;
      }
      for (const v of result.videos) {
        candidates.push({
          video: v,
          score: scoreVideo(v, guide),
          source: `channel ${ch.handle}`,
        });
      }
      console.log(`    ${result.videos.length} videos fetched`);
    } catch (err) {
      console.error(`    [error] ${err instanceof Error ? err.message : err}`);
    }
  }

  // 2. Vet each search query
  for (const q of guide.searchQueries) {
    try {
      console.log(`  ↳ search "${q}"...`);
      const ids = await searchVideoIds(q, args.maxPerQuery);
      if (ids.length === 0) {
        console.log(`    [no results]`);
        continue;
      }
      const videos = await getVideoMetadata(ids);
      for (const v of videos) {
        candidates.push({
          video: v,
          score: scoreVideo(v, guide),
          source: `search "${q}"`,
        });
      }
      console.log(`    ${videos.length} videos fetched`);
    } catch (err) {
      console.error(`    [error] ${err instanceof Error ? err.message : err}`);
    }
  }

  // Deduplicate by videoId (keep highest score)
  const byId = new Map<string, ScoredCandidate>();
  for (const c of candidates) {
    const existing = byId.get(c.video.videoId);
    if (!existing || c.score.total > existing.score.total) {
      byId.set(c.video.videoId, c);
    }
  }
  const deduped = Array.from(byId.values()).sort((a, b) => b.score.total - a.score.total);

  // Output
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
  const outPath = join(OUTPUT_DIR, `${basename}-candidates.md`);
  writeFileSync(outPath, renderReport(guide, deduped, args.searchTopN));
  console.log(`\n  ✓ Wrote ${outPath}`);
  console.log(
    `    Top score: ${deduped[0]?.score.total ?? 0} / 100  ·  Total deduped: ${deduped.length}`
  );
}

function renderReport(
  guide: CurationGuide,
  ranked: ScoredCandidate[],
  topN: number
): string {
  const top = ranked.slice(0, topN);
  const lines: string[] = [];
  lines.push(`# ${guide.clusterName} — YouTube Vetting Report`);
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(
    `Niches covered: ${guide.nichesCovered.length}  ·  Source channels: ${guide.sourceChannels.length}  ·  Candidates fetched: ${ranked.length}`
  );
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(`## Top ${top.length} candidates`);
  lines.push("");
  lines.push(
    "Ranked by total score (0-100). Score components: recency (15), engagement (20), length (15), relevance (30), Erie filter (-20 to +20)."
  );
  lines.push("");

  for (let i = 0; i < top.length; i++) {
    const { video, score, source } = top[i];
    lines.push(`### ${i + 1}. ${video.title}  —  ${score.total}/100`);
    lines.push("");
    lines.push(`**Channel:** ${video.channelTitle}  ·  **Source:** ${source}`);
    lines.push(`**Watch:** https://www.youtube.com/watch?v=${video.videoId}`);
    lines.push(
      `**Stats:** ${video.viewCount.toLocaleString()} views  ·  ${(
        (video.likeCount / Math.max(1, video.viewCount)) *
        100
      ).toFixed(1)}% like ratio  ·  ${(video.durationSec / 60).toFixed(1)} min  ·  published ${video.publishedAt.slice(0, 10)}`
    );
    lines.push("");
    lines.push(
      `**Score breakdown:** recency ${score.recency} · engagement ${score.engagement} · length ${score.length} · relevance ${score.relevance} · Erie ${score.erieFilter}`
    );
    if (score.positives.length > 0) {
      lines.push("");
      lines.push("**Positives:**");
      for (const p of score.positives) lines.push(`- ${p}`);
    }
    if (score.penalties.length > 0) {
      lines.push("");
      lines.push("**Penalties:**");
      for (const p of score.penalties) lines.push(`- ${p}`);
    }
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  lines.push("## Full ranked list");
  lines.push("");
  lines.push("| Rank | Score | Title | Channel | Source |");
  lines.push("|---:|---:|---|---|---|");
  ranked.forEach((c, i) => {
    const title = c.video.title.replace(/\|/g, "\\|").slice(0, 80);
    lines.push(
      `| ${i + 1} | ${c.score.total} | [${title}](https://www.youtube.com/watch?v=${c.video.videoId}) | ${c.video.channelTitle} | ${c.source} |`
    );
  });
  return lines.join("\n") + "\n";
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let guidePaths: string[];
  if (args.all) {
    guidePaths = listAllGuides();
    if (guidePaths.length === 0) {
      console.error("No curation guides found in", CURATION_DIR);
      process.exit(1);
    }
  } else if (args.cluster) {
    const p = findGuideFile(args.cluster);
    if (!p) {
      console.error(`No guide found for "${args.cluster}". Tried:`);
      console.error(`  ${CURATION_DIR}/cluster-${args.cluster}.md`);
      console.error(`  ${CURATION_DIR}/${args.cluster}.md`);
      process.exit(1);
    }
    guidePaths = [p];
  } else {
    console.error("Specify --cluster <name> or --all. Use --help for usage.");
    process.exit(1);
  }

  if (!args.dryRun && !process.env.YOUTUBE_API_KEY) {
    console.error(
      "\nERROR: YOUTUBE_API_KEY not set. Either:\n" +
        "  1. Add YOUTUBE_API_KEY to .env.local (get key at https://console.cloud.google.com/apis/credentials)\n" +
        "  2. Use --dry-run to test parsing without API calls\n"
    );
    process.exit(1);
  }

  for (const p of guidePaths) {
    await vetGuide(args, p);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
