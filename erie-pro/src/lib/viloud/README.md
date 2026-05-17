# Viloud Auto-Provision

Drives the Viloud TV web dashboard via Playwright to create or update channels in bulk, then writes the resulting channel IDs back to `src/lib/viloud-channels.ts`.

## ⚠ Status: scaffolding only

Viloud has no public API (per Flint audit, March 2026), so automation has to drive the browser. The full pipeline (config schema, YAML parsing, dry-run, channel-ID extraction, output writer, apply-IDs reverse-mapper) is built — but **the 6 DOM selectors marked `TODO(viloud-ui)` in `src/scripts/viloud-provision.ts` must be verified against the live Viloud dashboard before the script will run end-to-end.**

When Viloud credentials become available:

1. Run a single channel with `--headed` to watch what happens
2. Use Playwright's `npx playwright codegen https://app.viloud.tv` to capture the actual selectors
3. Update `SELECTORS` in `viloud-provision.ts`
4. Re-run; it should work for all channels

This is honest scaffolding. Don't run it expecting it to "just work" — the time saved vs. clicking through the UI is ~80% once the selectors are verified, but the verification step is a one-time hands-on session.

## End-to-end pipeline

```
docs/viloud-curation/cluster-X.md
         │
         │  (1) npm run youtube:vet -- --cluster X    [PR #53]
         ▼
docs/viloud-curation/output/cluster-X-candidates.md
         │
         │  (2) hand-curate (re-order, prune) into:
         ▼
viloud-config.json   ◄── this PR's config schema
         │
         │  (3) npx tsx src/scripts/viloud-provision.ts --config viloud-config.json
         ▼
viloud-provision-output.json   { slug: channelId }
         │
         │  (4) npx tsx src/scripts/viloud-provision.ts --apply-ids ...
         ▼
src/lib/viloud-channels.ts is updated
         │
         │  (next deploy)
         ▼
Viloud channels render live on niche pages [PR #48]
```

## Setup

```bash
# 1. Install Playwright (one-time, ~300MB browser binaries)
npm install --save-dev playwright
npx playwright install chromium

# 2. Set credentials in env (DO NOT commit)
export VILOUD_EMAIL='your@email.com'
export VILOUD_PASSWORD='your-password'

# 3. Build a config from your vetting output (or hand-write):
#    See src/scripts/viloud-provision.sample-config.json
```

## Usage

```bash
# Validate the config schema without touching the browser
npx tsx src/scripts/viloud-provision.ts --config my-config.json --dry-run

# Real run, headless (for batch CI)
npx tsx src/scripts/viloud-provision.ts --config my-config.json

# Real run, headed (for debugging selectors)
npx tsx src/scripts/viloud-provision.ts --config my-config.json --headed

# Apply the output back to viloud-channels.ts
npx tsx src/scripts/viloud-provision.ts --apply-ids viloud-provision-output.json
```

## Config format

JSON (YAML support is a TODO — would require pulling in `yaml` as a dep). Schema is enforced via Zod:

```json
{
  "channels": [
    {
      "slug": "plumbing",
      "name": "Erie Plumbing TV",
      "description": "24/7 plumbing education for Erie homeowners",
      "niches": ["plumbing", "drain-cleaning", "sewer-line-repair"],
      "videos": [
        {
          "youtubeId": "abc12345DEF",
          "title": "How plumbing works",
          "block": 1,
          "notes": "Foundations block opener"
        }
      ]
    }
  ]
}
```

Generate a starter config from a vet-youtube report:

```typescript
import { parseCandidatesReport, buildSeedConfig } from "@/lib/viloud/parse-candidates";
import { readFileSync, writeFileSync } from "fs";

const report = readFileSync("docs/viloud-curation/output/cluster-outdoor-seasonal-candidates.md", "utf-8");
const candidates = parseCandidatesReport(report);
const config = {
  channels: [buildSeedConfig(
    "landscaping",
    "Erie Outdoor TV",
    "Year-round outdoor home content for Erie property owners",
    ["landscaping", "snow-removal", "tree-service", "gutters"],
    candidates,
    30,  // top 30 candidates
    35   // min score 35
  )],
};
writeFileSync("viloud-config-outdoor-seasonal.json", JSON.stringify(config, null, 2));
```

## DOM selectors that need verification

In `src/scripts/viloud-provision.ts`, the `SELECTORS` constant has 11 entries. Each should be checked once against the live Viloud dashboard:

| Selector | What it should target |
|---|---|
| `loginEmail` | Email input on the login page |
| `loginPassword` | Password input on the login page |
| `loginSubmit` | The submit button |
| `loginSuccess` | An element visible only post-login (dashboard nav) |
| `createChannelButton` | "New channel" / "Create channel" CTA |
| `channelNameInput` | Channel name input on the create form |
| `channelDescriptionInput` | Channel description textarea |
| `saveChannelButton` | The form's submit button |
| `addVideoButton` | "Add video" button on a channel detail page |
| `videoUrlInput` | URL input in the add-video dialog |
| `confirmAddVideoButton` | The dialog's confirm button |

The fastest way to capture these is with Playwright's codegen:

```bash
npx playwright codegen https://app.viloud.tv
```

Click through the channel-creation flow manually; Playwright records the selectors. Paste them into `SELECTORS`.

## Failure handling

When a step fails the script:
- Writes `viloud-error-{slug}.png` (screenshot of the page at the failure point)
- Logs the error to stderr
- Continues with the next channel
- Reports `N succeeded, M failed` at the end

Partial output (the channels that did work) is still written to `viloud-provision-output.json` for `--apply-ids` to pick up.

## What this does NOT do

- **Doesn't update videos in an existing channel.** Only creates new channels. If a channel already exists for a slug, set `existingChannelId` in the config and the script... TODO(viloud-ui): not yet implemented; you'll need a separate "update playlist" flow.
- **Doesn't handle 2FA.** If your Viloud account requires 2FA, the script will fail at the login step. Add an interactive 2FA pause or use an app-specific password.
- **Doesn't verify embed permissions.** YouTube `videoEmbeddable:true` filtering happens at vet-youtube time; if a video has restrictions Viloud rejects, you'll see it in the screenshots.
- **Doesn't poll for channel ID via API.** Channel ID extraction depends on URL pattern `\/channels?\/[a-f0-9]{32}`. If Viloud uses a different ID format, update the regex in `provisionChannel`.

## Files

```
src/lib/viloud/
├── config-schema.ts          Zod schema for the JSON config
├── parse-candidates.ts       Pure: vet-youtube report → seed config
└── __tests__/
    └── parse-candidates.test.ts   8 tests

src/scripts/
├── viloud-provision.ts                CLI + Playwright orchestrator
└── viloud-provision.sample-config.json   Example config

src/lib/viloud-channels.ts    [existing] Channel ID mapping; --apply-ids updates this
```
