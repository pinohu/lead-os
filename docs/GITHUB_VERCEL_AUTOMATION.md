# GitHub + Vercel — full automation layout

This repo already runs **CI** on every push and pull request to `master` or `main` (see `.github/workflows/ci.yml`): install, **`npm run verify:product-surfaces`**, typecheck, tests, and production build for the hybrid kernel (plus Erie Pro and NeatCircle packages).

## Deploy (no extra CI token required)

1. In **Vercel**: Import the **GitHub** repository, select the **`lead-os-hosted-runtime-wt-hybrid`** directory as the app root (monorepo).
2. Set **Production Branch** to the branch you ship (`main` or `master`).
3. Configure **Environment Variables** in Vercel (Production / Preview) — same names as `.env.example` or your shared vault aliases per `lead-os-hosted-runtime-wt-hybrid/docs/ENV-VAULT-TO-CANONICAL.md`.

Vercel then **builds and deploys automatically** on every push to the linked branch and **Preview deployments** on pull requests. You do **not** need a `vercel deploy` step in GitHub Actions unless you want CI to drive deploys without Git integration (that would duplicate builds).

## Gate merges on green CI

In **GitHub** → **Settings** → **Rules** → **Rulesets** (or branch protection):

- Require status checks: **Type Check (Hybrid)**, **Test (Hybrid)**, **Build Hybrid Runtime** (and any other jobs you care about).
- Optionally enable **Require branches to be up to date** before merging.

## Optional: migration check against a real database

- Add repository secret **`HYBRID_DATABASE_URL`** (staging Postgres is enough).
- Run **Actions** → **Hybrid migrations verify** → **Run workflow** (`.github/workflows/hybrid-migrations.yml`).

This is manual-on-purpose so production DB URLs are never attached to every PR build.

## Dependency updates

**Dependabot** (`.github/dependabot.yml`) opens weekly PRs for npm packages. To automate merging when CI passes:

- Enable **auto-merge** on the repo (Settings → General → Pull Requests), and/or
- Use a GitHub **ruleset** with merge queue, or a bot like **Dependabot auto-merge** (third-party) with caution on major upgrades.

## “Commit” automation

- **Conventional Commits** + **squash merge** keeps history clean.
- **GitHub Actions** cannot push commits to your default branch without a **PAT** or **GitHub App** with contents write — usually you still **author** commits locally or via Copilot, and automation opens PRs (Dependabot, renovate-style).

If you want **fully automated releases** (tag + changelog + deploy), add a separate release workflow later; Vercel already deploys on push.
