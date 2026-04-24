# Completeness Testing (smoke URLs)

Use this pattern to **smoke-check** deployments you actually operate. Replace `ERIE_BASE`, `KERNEL_BASE`, and `NEATCIRCLE_BASE` with your staging or production origins. **Do not** assume the example hosts in older docs still resolve — verify DNS first.

## Preconditions

- Niche slugs and page types **must match** the `erie-pro` branch you deployed (lists drift — generate loops from that repo’s routes or sitemap, do not copy a frozen bash loop from history blindly).
- Kernel public routes evolve — align checks with `lead-os-hosted-runtime-wt-hybrid/docs/PRODUCT-SURFACES.md` and `/sitemap.xml` on your deploy.

## Erie Pro (example loop — edit niches/pages)

```bash
ERIE_BASE="${ERIE_BASE:-https://erie-pro.vercel.app}"
# Maintain niche list alongside erie-pro/src or prisma seed — this is illustrative only:
for niche in plumbing hvac; do
  for page in "" /blog /faq; do
    code=$(curl -so /dev/null -w "%{http_code}" "$ERIE_BASE/$niche$page")
    echo "$code $niche$page"
  done
done
```

## Kernel (minimal smoke)

```bash
KERNEL_BASE="${KERNEL_BASE:-https://lead-os-nine.vercel.app}"
for page in / /api/health /docs /pricing; do
  code=$(curl -so /dev/null -w "%{http_code}" "$KERNEL_BASE$page")
  echo "$code $page"
done
```

## NeatCircle

```bash
NEATCIRCLE_BASE="${NEATCIRCLE_BASE:-https://www.neatcircle.com}"
curl -so /dev/null -w "%{http_code}" "$NEATCIRCLE_BASE/"
```

## Pass criteria

- All checked URLs return **expected** status (usually `200` for public GET HTML; APIs may return `401`/`405` if you forgot auth — that is a **test design** issue, not a blind “200 only” rule).
- Record host, commit SHA, and timestamp in your run log.

## Do not claim

- Fixed totals like “697 URLs, 697 pass” — those numbers were tied to a **snapshot** of routes and third-party hosts and are **not** maintained automatically.
