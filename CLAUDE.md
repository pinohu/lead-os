# CLAUDE.md — Project Context for Future Sessions

This file is read by Claude at the start of each session working on this repo. It documents project-specific guidance that shouldn't be re-explained every session.

## Project identity

This is **lead-os** — the monorepo behind **erie.pro**, a hyperlocal professional services directory for Erie, PA. The `erie-pro/` subdirectory is the Next.js app. The site is live in production at https://erie.pro.

**Stack:** Next.js 15 + Prisma 7 + Neon Postgres + Vercel.

**Niche coverage:** 112 niches across 11 functional clusters (defined in `erie-pro/src/lib/niche/educational-content.ts`).

## Working preferences (Ike, project owner)

### Over-engineering override is ACTIVE for this project

Ike's personal-memory pattern flags him as someone who builds infrastructure before revenue, and most past Claudes would redirect toward shipping/revenue. **For lead-os specifically, Ike has explicitly and persistently authorized that override — do not apply the redirect pattern when working in this codebase.**

This means:
- Build solid infrastructure rather than triaging to immediate revenue
- Take time for tests, types, and documentation
- Multi-PR refactors are encouraged over hacks
- The standing answer to "should I build this properly or ship a shortcut?" is **build properly**

The override is **scoped to this project**. Other Dynasty Empire projects (PA CROP, ikeohu.com, MSEAM, etc.) default back to the "redirect toward revenue" pattern unless Ike re-authorizes there.

### Git config

Before any commit, set:
```
git config user.email "polycarpohu@gmail.com"
git config user.name "pinohu"
```

Vercel rejects deploys from other git authors.

### Branching + PR pattern

- Branch off master for each piece of work (no long-lived feature branches)
- One PR per logical change; multi-PR sequences for stacked work are fine
- Squash-merge is the default merge method
- After squash-merging a stacked PR's base, the stacked PR will need a force-rebase (this is normal squash-stack workflow)
- Vercel feature-branch previews auto-cancel — push to main only for deployment

### Test discipline

- Pure logic (parsers, scorers, decision trees) gets unit tests via Vitest
- Routes, DB-touching code: don't add prisma-mocked tests unless you're also adding the mock pattern (the codebase has no existing prisma mock); rely on regression + API smoke tests
- All commits should keep the test suite green
- Run `npx vitest run` (full suite) and `npx tsc --noEmit` before push
- Production build sanity: `SKIP_ENV_VALIDATION=1 npm run build`

## Project structure landmarks

```
erie-pro/                          The Next.js app
├── src/
│   ├── app/                       App Router pages + API routes
│   │   ├── api/intake/            Conversational intake endpoints
│   │   ├── admin/                 Admin dashboard (auth-gated)
│   │   └── [niche]/               Dynamic niche pages (one per slug)
│   ├── components/
│   │   ├── intake-widget.tsx      The conversational lead-capture widget
│   │   └── viloud-channel-embed.tsx   24/7 niche video channel
│   ├── lib/
│   │   ├── intake/                Conversation logic, classifier, analytics
│   │   ├── youtube/               Vetting pipeline (parser + scorer + client)
│   │   ├── viloud/                Auto-provision config + parsers
│   │   ├── niches.ts              The 44 base niches
│   │   ├── additional-niches.ts   68 more niches (total: 112)
│   │   └── niche/educational-content.ts   Per-cluster content generator
│   └── scripts/
│       ├── vet-youtube.ts                Score candidate videos
│       └── viloud-provision.ts           Playwright auto-channel-creator
└── docs/
    ├── viloud-curation/                  16 curation guides (5 priority + 11 cluster)
    └── qa/intake-widget-qa.md            Manual QA script for production
```

## Pipeline overview (intake widget end-to-end)

1. Visitor lands on `/[niche]` (e.g. `/plumbing`)
2. Intake widget shows; `POST /api/intake/start` creates a conversation with `startedFromNicheSlug`
3. Visitor describes problem; `POST /api/intake/message` classifies via Anthropic + keyword fallback
4. Routing decision (`decideNicheRouting`) picks niche: classifier-primary / candidate-override / hint / ambiguous
5. If `candidateNiches` returns alternatives, the "did you mean?" UI surfaces them; user can `POST /api/intake/switch-niche`
6. Conversation continues: location → urgency → budget → contact (with TCPA)
7. Lead row created on contact completion; provider routing/notifications via existing pipeline
8. Admin dashboard at `/admin/intake-analytics` shows funnel, switch rate, classifier confidence

## Viloud + YouTube content pipeline

1. Cluster curation guide in `docs/viloud-curation/cluster-{name}.md` (channels + queries + Erie filter)
2. `npm run youtube:vet -- --cluster X` → ranked candidates at `docs/viloud-curation/output/`
3. Hand-curate into a Viloud provision config (JSON)
4. `npx tsx src/scripts/viloud-provision.ts --config X.json` → creates channels (Playwright, browser-driven; selectors need live-UI verification on first run)
5. `--apply-ids` writes channel IDs back into `src/lib/viloud-channels.ts`
6. Next deploy: embeds render live on niche pages

## Things to NEVER do without explicit Ike approval

- Touch financial flows (Stripe, billing)
- Add legal-disclaimer / contractor-licensing language without verification
- Modify TCPA text (`TCPA_TEXT_V2` in `src/lib/intake/conversation.ts`)
- Change the (814) 200-0328 concierge number anywhere
- Delete or rename existing niche slugs (URLs are live; SEO impact)
- Push to master without going through PR + CI (even for tiny changes)

## Things to ALWAYS do

- Read this file at session start
- Read relevant SKILL.md files before file creation
- Set git author config before commits
- Run TS check + tests + build before push
- Open a PR per logical change
