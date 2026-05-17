// ── Parse vet-youtube reports → channel-config seeds ─────────────────
// Reads a candidates markdown file produced by vet-youtube and extracts
// the top N video IDs ranked by score. Used to bootstrap a Viloud
// provision config from a cluster's vetting output.

export interface CandidateVideo {
  rank: number;
  score: number;
  title: string;
  youtubeId: string;
  channelTitle: string;
}

/**
 * Parse a candidates report (output/cluster-{name}-candidates.md).
 * Returns videos in rank order from the "Full ranked list" table.
 */
export function parseCandidatesReport(markdown: string): CandidateVideo[] {
  const results: CandidateVideo[] = [];

  // Look for the "Full ranked list" section and its table.
  const sectionMatch = /## Full ranked list[\r\n]+([\s\S]+?)(?:\n##|\n*$)/i.exec(
    markdown
  );
  if (!sectionMatch) return results;

  const section = sectionMatch[1];

  // Table rows: | rank | score | [title](url) | channel | source |
  const rowRe = /^\|\s*(\d+)\s*\|\s*([\d.]+)\s*\|\s*\[([^\]]+)\]\((https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]+))\)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm;

  let m;
  while ((m = rowRe.exec(section)) !== null) {
    const [, rank, score, title, , videoId, channelTitle] = m;
    results.push({
      rank: parseInt(rank, 10),
      score: parseFloat(score),
      title: title.replace(/\\\|/g, "|").trim(),
      youtubeId: videoId,
      channelTitle: channelTitle.trim(),
    });
  }

  return results;
}

/**
 * Build a ViloudChannelConfig from a parsed candidates list. Caller can
 * further edit the result (re-order, prune low-score entries, add notes)
 * before writing to YAML.
 */
export function buildSeedConfig(
  slug: string,
  name: string,
  description: string,
  niches: string[],
  candidates: CandidateVideo[],
  topN = 30,
  minScore = 35
): {
  slug: string;
  name: string;
  description: string;
  niches: string[];
  videos: Array<{ youtubeId: string; title: string; notes: string }>;
} {
  const qualified = candidates
    .filter((c) => c.score >= minScore)
    .slice(0, topN);

  return {
    slug,
    name,
    description,
    niches,
    videos: qualified.map((c) => ({
      youtubeId: c.youtubeId,
      title: c.title,
      notes: `score ${c.score} · rank #${c.rank} · ${c.channelTitle}`,
    })),
  };
}
