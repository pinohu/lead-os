# Claims verification — what “yes” means for this repository

Marketing copy, architecture diagrams, and long-form guides describe a **large surface area**. Not every sentence in every Markdown file is machine-checked against code.

## Canonical contract (verified against the tree)

The following are treated as **binding product claims** for the kernel (`lead-os-hosted-runtime-wt-hybrid/`):

1. **`docs/PRODUCT-SURFACES.md`** — public and in-app doc routes, operator prefix, repository-only docs.
2. **`docs/START-HERE.md`** (repo root `lead-os/docs/`) — clone path, health URL, `/docs` hub, Postgres/migrations flow, operator sign-in path, quality gates.
3. **Hybrid `README.md` — “Key URLs”** table and **“Operator Dashboard Pages”** list (must match `src/app/dashboard/**/page.tsx` counts).
4. **Narrative in hybrid `README.md` — “Architecture”** code block: each `/api/…` line must resolve to a `src/app/api/…/route.ts` (or documented cron subpath).

Everything else under `docs/`, `LEAD-OS-COMPLETE-GUIDE.md`, `SERVICE-BLUEPRINTS.md`, `make-scenarios/`, `.cursor/skills/`, and `_n8n_sources/` is **supporting material** unless it is explicitly linked from the three sources above as a hard requirement.

## Automated check

From `lead-os-hosted-runtime-wt-hybrid/`:

```bash
npm run verify:product-surfaces
```

This fails the build if any mapped `page.tsx` or API entrypoint from PRODUCT-SURFACES + Key URLs is missing on disk.

## Vercel shared env names

If variable **names** on Vercel differ from `.env.example`, see [`ENV-VAULT-TO-CANONICAL.md`](./ENV-VAULT-TO-CANONICAL.md) — the kernel applies a small alias map at Node startup (`src/lib/env-vault-aliases.ts`).

## Human gates (still required)

- `npm test`, `npx tsc --noEmit`, `npm run build` — behavior and types.
- `npm run verify:migrations` when `DATABASE_URL` is set.
- Third-party integrations: **dry-run** without keys is intentional; live behavior is an ops claim, not a static file check.

When those pass and this script passes, it is honest to say: **the repository’s canonical surface-area claims are delivered by the codebase as checked in.**
