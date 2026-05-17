# YouTube Vetting Pipeline

Automatically score candidate YouTube videos against the cluster curation guides in `erie-pro/docs/viloud-curation/`. Produces ranked candidate reports the curator can review and approve, instead of manually browsing hours of YouTube per channel.

## What it does

1. **Parses** a cluster (or single-niche) curation guide
2. **Fetches** recent videos from each recommended source channel + each search query, via the YouTube Data API v3
3. **Scores** each video on five axes (recency, engagement, length, relevance, Erie filter) with a 0-100 total
4. **Outputs** a ranked markdown report at `docs/viloud-curation/output/cluster-{name}-candidates.md`

## Setup

### 1. Get a YouTube Data API key

1. Go to https://console.cloud.google.com/apis/credentials
2. Create a project (or use an existing one)
3. Enable the **YouTube Data API v3**
4. Create an API key (restrict it to "YouTube Data API v3" referrer if you want extra safety)
5. Add to `erie-pro/.env.local`:

   ```
   YOUTUBE_API_KEY=your_key_here
   ```

### 2. Quota

Default quota is **10,000 units/day** which is plenty:

| Operation | Cost | Used by |
|---|---:|---|
| `search.list` | 100 units | Each curation search query |
| `channels.list` | 1 unit | Resolve handle → uploads playlist |
| `playlistItems.list` | 1 unit | Get recent video IDs from a channel |
| `videos.list` (batched 50) | 1 unit | Get full metadata per batch |

A full cluster vet (15 channels + 10 queries, default settings) is ~50–150 units. You can vet all 11 clusters multiple times per day before hitting the quota.

## Usage

```bash
# Vet a single cluster (uses cluster-{name}.md or {name}.md)
npm run youtube:vet -- --cluster outdoor-seasonal
npm run youtube:vet -- --cluster plumbing

# Vet every guide in docs/viloud-curation/
npm run youtube:vet -- --all

# Parse-only — verify the guide structure without burning API quota
npm run youtube:vet:dry -- --cluster outdoor-seasonal

# Tune limits
npm run youtube:vet -- --cluster plumbing --max-per-channel 30 --max-per-query 15 --top 20
```

## Output

Each run writes `docs/viloud-curation/output/cluster-{name}-candidates.md` with:

- **Top N candidates** (default 15): full breakdown per video including
  - Score (0-100) and component subscores
  - Direct YouTube watch link
  - Stats (views, like ratio, duration, publish date)
  - Positives and penalties explaining the ranking
- **Full ranked table**: every deduplicated candidate, score-sorted

## Scoring criteria

Total = recency + engagement + length + relevance + Erie filter (max 100, floored at 0).

| Axis | Max | Logic |
|---|---:|---|
| **Recency** | 15 | < 1 yr full; > 4 yr penalized; > 7 yr heavy penalty |
| **Engagement** | 20 | Like ratio (≥2% good, ≥4% great), view threshold, comment health |
| **Length** | 15 | 5–20 min sweet spot; very short or very long penalized |
| **Relevance** | 30 | Title/description matches against programming-block themes from the guide |
| **Erie filter** | ±20 | Climate-mismatch terms ("Arizona", "Florida", etc.) penalized; cold-climate terms rewarded |

The scoring weights are tunable in `src/lib/youtube/score-video.ts` (`WEIGHTS` constant).

## What this pipeline does NOT do

- **Doesn't auto-add videos to a Viloud channel** — that's a separate concern (see the Viloud auto-provision script when it ships). The output is curator-reviewable; you still approve before videos go live.
- **Doesn't check video embed permissions beyond `videoEmbeddable: true`** in the search filter. Some videos may still fail to embed in third-party players for region/policy reasons; verify in Viloud.
- **Doesn't fetch transcripts** for deeper content analysis. The current title/description matching is good enough for first-pass ranking; transcript analysis is a 10× quota cost.
- **Doesn't handle live streams** or premieres. The scoring assumes on-demand video metadata.
- **Doesn't crawl beyond `playlistItems.list` maxResults=50** per channel call. To vet older library, increase `--max-per-channel` (each +50 = 1 extra API call).

## Architecture

```
src/lib/youtube/
├── parse-curation.ts        Pure markdown → CurationGuide parser
├── score-video.ts           Pure VideoCandidate → ScoreBreakdown scorer
├── client.ts                YouTube Data API v3 wrapper (requires API key)
└── __tests__/
    ├── parse-curation.test.ts    8 tests, parser correctness
    └── score-video.test.ts       12 tests, scoring logic

src/scripts/
└── vet-youtube.ts           CLI orchestrator
```

The parser and scorer are pure functions with no IO — they're fully unit-tested. The client makes real API calls and is exercised by integration runs.

## Iterating on the scoring

If the top-ranked videos don't match your taste:

1. Look at the **penalties** for the videos you'd have picked — what's flagged that shouldn't be?
2. Look at the **positives** for the videos you'd have skipped — what's rewarded that shouldn't be?
3. Adjust `WEIGHTS` in `score-video.ts`, or refine the component scorers
4. Re-run with `--dry-run` to verify the guide parsing didn't break, then a real run to see ranking shifts
5. Add a test case to `score-video.test.ts` that captures the new desired behavior
