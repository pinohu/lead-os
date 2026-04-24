# Vercel deployment strategy

> **Do not commit secrets or stable infra identifiers into docs.** Project IDs, team IDs, and bearer tokens belong in your password manager or CI variables — rotate anything that was ever pasted into chat or Markdown.

## Typical layout (monorepo)

| Logical app | Vercel `rootDirectory` | Notes |
|-------------|------------------------|--------|
| Kernel (`lead-os-hosted-runtime-wt-hybrid`) | `lead-os-hosted-runtime-wt-hybrid` | Usually linked from **repo root** so `app/` paths resolve once |
| `erie-pro` | `erie-pro` **or** standalone repo | Match how the Vercel project was first imported |
| `neatcircle-beta` | `neatcircle-beta` | Workers/OpenNext flow may differ — see that package’s README |

Configure the three values in the Vercel dashboard or with `PATCH /v9/projects/{id}` using **`VERCEL_TOKEN`** from your environment — do not hard-code IDs in this repository.

## Kernel deploy (pattern)

```bash
cd /path/to/lead-os   # monorepo root
npx vercel --prod --yes
```

Ensure the linked Git integration uses the same `rootDirectory` you expect; otherwise Next.js will double-prefix paths.

## Erie Pro deploy (pattern)

```bash
cd /path/to/lead-os/erie-pro
npx vercel --prod --yes
```

## Auth token

Use `vercel login` on the machine doing deploys. Token storage location is **platform-specific** (see Vercel CLI docs) — never paste absolute paths from another developer’s laptop into shared docs.

## Post-deploy verification

Substitute your real hosts:

```bash
curl -sI "https://$KERNEL_HOST/" | head -n 3
curl -sS "https://$KERNEL_HOST/api/health"
```

## Common issues

- **404 / double path** — `rootDirectory` mismatch; redeploy from the directory Vercel expects.
- **Cron or API auth failures** — compare `src/middleware.ts` allowlists with the route you are probing.
- **Stale content** — confirm the deployment finished and CDN cache headers.
