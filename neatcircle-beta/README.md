# NeatCircle (edge / marketing) — `neatcircle-beta`

Cloudflare Workers–oriented Next.js app (OpenNext) for marketing and edge experiences. The **kernel** (APIs, operator dashboard, billing, marketplace) lives in **`../lead-os-hosted-runtime-wt-hybrid/`**. Read **`../lead-os-hosted-runtime-wt-hybrid/docs/PRODUCT-SURFACES.md`** before linking to kernel routes from this site so you do not promise operator-only URLs publicly.

## Local Development

```bash
npm install
npm run dev
```

## Cloudflare Workers Deployment

This app is configured for Cloudflare Workers using OpenNext.

### One-time setup

```bash
npm install
npm run cf:typegen
```

### Preview locally

```bash
npm run cf:preview
```

### Deploy

```bash
npm run cf:deploy
```

### Required Cloudflare setup

- Create or select a Workers project
- Authenticate Wrangler with your Cloudflare account
- Add any runtime secrets with `wrangler secret put <NAME>`
- If you use a custom domain, attach the route in the Cloudflare dashboard

### Important notes

- The Worker entrypoint is generated at `.open-next/worker.js`
- Static assets are served from `.open-next/assets`
- Node compatibility is enabled via `nodejs_compat`
- Middleware and route handlers run on the Worker runtime
- OpenNext is most reliable on Linux or WSL; Windows builds can fail on local process spawning
