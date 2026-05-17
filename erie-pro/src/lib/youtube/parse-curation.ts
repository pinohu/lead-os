// ── Cluster curation guide parser ────────────────────────────────────
// Extracts source channels, programming structure, search queries, and
// the Erie filter from the cluster-*.md / niche.md curation files in
// erie-pro/docs/viloud-curation/.
//
// The parser is regex-based because the file format is consistent
// across all guides (they were all written from the same template).
// If the template changes, update REGEXEN here.

export interface SourceChannel {
  /** Human-readable channel name from the table */
  name: string;
  /** YouTube handle (e.g. "@thisoldhouse"), or null if only a "Search" hint */
  handle: string | null;
  /** URL extracted from the markdown link, if present */
  url: string | null;
  /** Free-form description / why-it's-good column */
  rationale: string;
  /** Sub-niches this channel is best suited for */
  bestFor: string;
}

export interface ProgrammingBlock {
  /** Block number (1-indexed) */
  index: number;
  /** Theme name from the table */
  theme: string;
  /** Approximate video count for this block (may be a string like "5") */
  count: string;
  /** Example titles or descriptions */
  examples: string;
}

export interface CurationGuide {
  /** Cluster name from the title heading */
  clusterName: string;
  /** Anchor niche slug (e.g. "landscaping" for outdoor-seasonal cluster) */
  anchorNiche: string | null;
  /** All niche slugs covered by this guide */
  nichesCovered: string[];
  /** Source channels recommended for this cluster */
  sourceChannels: SourceChannel[];
  /** Programming blocks for the 24-hour rotation */
  programmingBlocks: ProgrammingBlock[];
  /** Search queries extracted from the "Search queries" section */
  searchQueries: string[];
  /** Erie-specific filter notes (strings to exclude or prioritize) */
  erieFilterIncludes: string[];
  /** Erie-specific terms to SKIP / exclude from results */
  erieFilterExcludes: string[];
}

// ── Regex helpers ────────────────────────────────────────────────────

/** First H1 heading is the cluster name (e.g. "# Plumbing TV — Curation Guide") */
const H1 = /^#\s+(.+?)(?:\s+[—-]+\s+Curation Guide)?\s*$/m;

/** "**Anchor niche:** `landscaping`" */
const ANCHOR = /\*\*Anchor niche:\*\*\s+`([a-z0-9-]+)`/i;

/** "**Cluster:** outdoor-seasonal (16 niches share this channel pattern)" */
const CLUSTER_HEADER = /\*\*Cluster:\*\*\s+([a-z0-9-]+)/i;

/** Niche bullets: "- `landscaping` (anchor) — ..." or "- `plumbing`" */
const NICHE_BULLET = /^\s*[-*]\s+`([a-z0-9-]+)`/gm;

/** Table row: "| Channel name | URL | Why | Best for |" — skip header/separator */
const TABLE_ROW = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm;

/** Markdown link: [text](url) — extract the URL */
const MD_LINK_URL = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/;

/** YouTube handle in any text */
const YT_HANDLE = /@[A-Za-z0-9_\-.]+/;

// ── Main parser ──────────────────────────────────────────────────────

export function parseCurationGuide(markdown: string): CurationGuide {
  const clusterName = H1.exec(markdown)?.[1]?.trim() ?? "Unknown";
  const anchorNiche = ANCHOR.exec(markdown)?.[1] ?? null;
  const clusterSlug = CLUSTER_HEADER.exec(markdown)?.[1] ?? null;

  const nichesCovered = extractNichesCovered(markdown);
  const sourceChannels = extractSourceChannels(markdown);
  const programmingBlocks = extractProgrammingBlocks(markdown);
  const searchQueries = extractSearchQueries(markdown);
  const { erieFilterIncludes, erieFilterExcludes } = extractErieFilter(markdown);

  return {
    clusterName: clusterSlug ?? clusterName,
    anchorNiche,
    nichesCovered,
    sourceChannels,
    programmingBlocks,
    searchQueries,
    erieFilterIncludes,
    erieFilterExcludes,
  };
}

function extractNichesCovered(markdown: string): string[] {
  // Look for the "Niches covered" section, then collect all backtick-slugs
  // until the next heading.
  const startIdx = markdown.search(/^##\s+Niches covered\b/m);
  if (startIdx < 0) {
    // Fall back: collect all unique slugs from the whole doc
    const slugs = new Set<string>();
    let m;
    NICHE_BULLET.lastIndex = 0;
    while ((m = NICHE_BULLET.exec(markdown)) !== null) {
      slugs.add(m[1]);
    }
    return Array.from(slugs);
  }
  const tail = markdown.slice(startIdx);
  const sectionEnd = tail.search(/^##\s+/m);
  const section = sectionEnd > 0 ? tail.slice(0, sectionEnd) : tail;
  const slugs = new Set<string>();
  let m;
  const re = /`([a-z0-9-]+)`/g;
  while ((m = re.exec(section)) !== null) {
    // Filter out non-slug-like backticked content (e.g. command examples)
    if (m[1].length >= 2 && m[1].length <= 60) {
      slugs.add(m[1]);
    }
  }
  return Array.from(slugs);
}

function extractSourceChannels(markdown: string): SourceChannel[] {
  // Find the recommended-channels section (matches "## Recommended source channels"
  // and similar variants).
  const startMatch = /^##\s+Recommended source channels/im.exec(markdown);
  if (!startMatch) return [];
  const after = markdown.slice(startMatch.index);
  const nextSection = after.search(/^##\s+/m);
  const tableRegion =
    nextSection > startMatch[0].length
      ? after.slice(startMatch[0].length, nextSection)
      : after.slice(startMatch[0].length);

  const channels: SourceChannel[] = [];
  let m;
  TABLE_ROW.lastIndex = 0;
  while ((m = TABLE_ROW.exec(tableRegion)) !== null) {
    const [, c1, c2, c3, c4] = m;
    // Skip header and separator rows
    if (/^[-:|\s]+$/.test(c1) || c1.trim().toLowerCase() === "channel") continue;
    if (c1.includes("---")) continue;

    // Extract URL and handle
    const urlMatch = MD_LINK_URL.exec(c2);
    const url = urlMatch?.[2] ?? null;
    const handleMatch = c2.match(YT_HANDLE);
    const handle = handleMatch?.[0] ?? null;

    channels.push({
      name: c1.trim(),
      handle,
      url,
      rationale: c3.trim(),
      bestFor: c4.trim(),
    });
  }
  return channels;
}

function extractProgrammingBlocks(markdown: string): ProgrammingBlock[] {
  const startMatch = /^##\s+Programming structure/im.exec(markdown);
  if (!startMatch) return [];
  const after = markdown.slice(startMatch.index);
  const nextSection = after.search(/^##\s+(?!Programming)/m);
  const tableRegion = nextSection > 0 ? after.slice(0, nextSection) : after;

  const blocks: ProgrammingBlock[] = [];
  let m;
  TABLE_ROW.lastIndex = 0;
  while ((m = TABLE_ROW.exec(tableRegion)) !== null) {
    const [, c1, c2, c3, c4] = m;
    // First column should be a number
    const idx = parseInt(c1.trim(), 10);
    if (Number.isNaN(idx)) continue;
    blocks.push({
      index: idx,
      theme: c2.trim(),
      count: c3.trim(),
      examples: c4.trim(),
    });
  }
  return blocks;
}

function extractSearchQueries(markdown: string): string[] {
  const startMatch = /^##\s+Search queries/im.exec(markdown);
  if (!startMatch) return [];
  const after = markdown.slice(startMatch.index);
  const nextSection = after.search(/^##\s+(?!Search)/m);
  const section = nextSection > 0 ? after.slice(0, nextSection) : after;

  // Bullets like "- `spring lawn prep northern climate` — block 1"
  const queries: string[] = [];
  const re = /^\s*[-*]\s+`([^`]+)`/gm;
  let m;
  while ((m = re.exec(section)) !== null) {
    queries.push(m[1].trim());
  }
  return queries;
}

function extractErieFilter(markdown: string): {
  erieFilterIncludes: string[];
  erieFilterExcludes: string[];
} {
  const startMatch = /^##\s+Erie-specific filter/im.exec(markdown);
  if (!startMatch) return { erieFilterIncludes: [], erieFilterExcludes: [] };
  const after = markdown.slice(startMatch.index);
  const nextSection = after.search(/^##\s+(?!Erie)/m);
  const section = nextSection > 0 ? after.slice(0, nextSection) : after;

  // Look for a "Skip" subsection — bullets under it are excludes
  const skipMatch = /Skip(?:\s+content that)?:?[\r\n]+([\s\S]*?)(?=\n\s*[^\s-]|\n##|$)/i.exec(
    section
  );
  const excludeBlock = skipMatch?.[1] ?? "";

  const excludes: string[] = [];
  const includes: string[] = [];

  const re = /^\s*[-*]\s+(.+)$/gm;
  let m;
  while ((m = re.exec(excludeBlock)) !== null) {
    excludes.push(m[1].trim());
  }

  // Anything bulleted in the section that isn't in the "Skip" block goes into includes
  const sectionBeforeSkip = skipMatch
    ? section.slice(0, skipMatch.index)
    : section;
  const includeRe = /^\s*[-*]\s+(.+)$/gm;
  let mi;
  while ((mi = includeRe.exec(sectionBeforeSkip)) !== null) {
    includes.push(mi[1].trim());
  }

  return { erieFilterIncludes: includes, erieFilterExcludes: excludes };
}
