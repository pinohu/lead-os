# Erie.Pro Deployment Source Audit

Date checked: 2026-05-10

## Finding

The live Erie.Pro site was deployed from `https://github.com/pinohu/lead-os.git`, but not from the clean committed tree alone.

Vercel shows the production deployment was created by CLI from `pinohu/lead-os`, branch `master`, commit `a667033749b6327430d3ce024753494c1650c53e`, with `gitDirty: 1`. That means uncommitted local changes were included in the production deployment.

The matching dirty local worktree has now been found at:

`C:\Users\VRLab\Documents\Codex\2026-05-05\deeply-consider-this-thesis-and-it-2`

For ConvertBox planning and Erie.Pro source review, that dirty worktree plus live production are now the working source of truth. The clean public GitHub refs are stale/incomplete until those changes are committed and pushed.

## Live Site Evidence

- URL checked: `https://erie.pro/`
- Platform: Vercel
- Response headers include `Server: Vercel`, `X-Nextjs-Prerender: 1`, and `X-Vercel-Cache: HIT`.
- Live deployment asset id observed: `dpl_44WuD1jsKAwSdrcdsDWJEPfRsP8K`.
- Live HTML contains the 112-service public request experience.
- Live service inventory is documented in `ERIE-PRO-LIVE-SERVICE-INVENTORY.md`.
- Vercel production deployment id: `dpl_44WuD1jsKAwSdrcdsDWJEPfRsP8K`.
- Vercel project id: `prj_ZrLsCE8EKeas6mpWaUSWPgFdcatp`.
- Vercel project name: `erie-pro`.
- Vercel project root directory: `erie-pro`.
- Vercel build command: `npm run build`.
- Vercel install command: `npm install`.
- Vercel production branch: `master`.
- Vercel deployment source: `cli`.
- Vercel deployment metadata includes `gitDirty: 1`, confirming uncommitted local changes were deployed.

## GitHub Evidence

- Repository checked: `https://github.com/pinohu/lead-os.git`
- Local branch: `master`
- `origin/master`: `a667033749b6327430d3ce024753494c1650c53e`
- `origin/main`: `9d6f1ee7033914a3a05f039008a665c15f1ad166`
- `origin/HEAD`: `origin/master`
- All visible remote branches and fetched PR heads were searched for live-only service names including:
  - `General Contractor`
  - `Estate Sale Services`
  - `Boat Repair`
  - `Mental Health Counseling`
  - `Funeral Homes`
- No clean fetched `erie-pro` ref contains the live 112-service catalog.
- `erie-pro/src/lib/niches.ts` in the clean fetched refs remains the older 44-service catalog.
- Git history for `erie-pro/src/lib/niches.ts` shows the last visible service expansion as the 44-niche update, not the 112-service live catalog.

## Local Dirty Worktree Recovered

The deployed 112-service source exists locally in:

`C:\Users\VRLab\Documents\Codex\2026-05-05\deeply-consider-this-thesis-and-it-2`

Key recovered files:

- `erie-pro/src/lib/additional-niches.ts`
- `erie-pro/src/lib/niches.ts`
- `erie-pro/src/lib/seo-page-plans.json`
- `erie-pro/docs/seo/erie-pro-seo-article-keyword-cluster-links.csv`
- `erie-pro/docs/seo/erie-pro-seo-article-keyword-cluster-links.md`

`additional-niches.ts` contains 68 additional service categories, including `Estate Sale Services`, `Mental Health Counseling`, `Boat Repair / Marine Services`, and `Salt & De-Icing Services`.

The dirty `niches.ts` imports `additionalNiches` and exports:

`export const niches: LocalNiche[] = [...baseNiches, ...additionalNiches];`

That reconciles the live 112 services:

- 44 base services.
- 68 additional services.
- 112 total live services.

## Wider Public Repo Scan

Because GitHub code search requires authentication in this session, I shallow-cloned and searched the most relevant public `pinohu` repositories available through the GitHub public API:

- `digitalproducts`
- `ikeohu`
- `dynasty-launcher`
- `pa-crop-services`
- `lead-os-hosted-runtime`
- `lead-os-embed-widgets`
- `dynasty-authority-template`
- `authority-blueprint`
- `leadOSGov`
- `Lead-Acquisition-Retention-Conversion`
- `leadnest-flow-forge`
- `leadgen-ai-portal`
- `dynasty-services`

Search terms included live-only Erie.Pro strings such as `Browse all 112`, `Estate Sale Services`, `Mental Health Counseling`, `Boat Repair / Marine Services`, and `Salt & De-Icing Services`.

Result: the live 112-service Erie.Pro catalog was not found in clean public refs because the production deployment included uncommitted local changes.

## Live Site Structure Recovered

The live `https://erie.pro/sitemap.xml` exposes:

- 3,505 public URLs.
- 124 top-level URLs.
- 3,380 second-level URLs.
- 112 service categories on `/services`.
- Each service category exposes a public route cluster such as:
  - Main service page.
  - Blog.
  - Guides.
  - FAQ.
  - Pricing.
  - Costs.
  - Compare.
  - Emergency.
  - Glossary.
  - Seasonal.
  - Checklist.
  - Directory.
  - Reviews.
  - Tips.
  - Certifications.
  - Provider pages where provider inventory exists.

This is enough to continue ConvertBox planning from the live site, even before the deployment source is reconciled.

## Correction

The earlier 44-service ConvertBox representation was incomplete because it trusted the fetched repo catalog before reconciling against production. The corrected planning baseline is:

1. Use the live 112 services from `ERIE-PRO-LIVE-SERVICE-INVENTORY.md`.
2. Treat `ERIE-PRO-SERVICE-CONVERTBOX-BLUEPRINTS.md` as a template/family draft, not a complete 112-service implementation.
3. Do not assume clean `origin/main` or clean `origin/master` can reproduce the current live Erie.Pro deployment until the recovered dirty worktree is committed and pushed.

## Likely Explanations

Confirmed explanation:

Erie.Pro was deployed from a local working tree that contained uncommitted changes.

## Next Needed Access

To fully eliminate the disconnect:

1. Review the dirty worktree at `C:\Users\VRLab\Documents\Codex\2026-05-05\deeply-consider-this-thesis-and-it-2`.
2. Commit and push the Erie.Pro changes that generated production.
3. Rebuild production from the clean pushed commit.
4. Use that pushed commit as the source of truth going forward.
