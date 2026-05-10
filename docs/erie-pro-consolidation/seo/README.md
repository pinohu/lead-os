# Erie.pro SEO Planning Artifacts

This folder contains the local SEO planning and live-page link inventory for Erie.pro.

## Files

- `erie-pro-local-seo-launch-blueprint.xlsx`
  - Workbook used to plan the Erie.pro local SEO launch.
  - Includes services, Erie-specific phrases, keyword clusters, page plans, local SEO actions, launch waves, quality gates, schema rules, internal linking, provider alignment, measurement, and refresh planning.

- `erie-pro-local-seo-build-spec.md`
  - Implementation spec for the Erie.pro local SEO page system.
  - Covers canonical URL structure, page templates, local SEO rules, schema rules, internal linking, indexing, quality gates, tracking, rollout, and compliance cautions.

- `erie-pro-seo-article-keyword-cluster-links.csv`
  - Machine-readable inventory of canonical SEO article pages.
  - Columns include service, generated slug, canonical slug, keyword cluster/page type, URL, primary keyword, supporting keyphrases, SEO title, and meta description.

- `erie-pro-seo-article-keyword-cluster-links.md`
  - Human-readable list of SEO article pages grouped by keyword cluster/page type.
  - Uses canonical Erie.pro URLs.

- `outscraper-directory-population.md`
  - Runbook for populating service directories from Outscraper and rendering cleaned provider images.

## Current Inventory

- 112 service categories
- 448 planned SEO page plans from the keyword workbook
- 224 reviews/FAQ supporting article pages
- 672 total canonical SEO article URLs listed in the link inventory

## Canonical Domain Rule

Use `https://erie.pro` as the canonical domain. The `services.erie.pro` subdomain is a redirect bridge and should not be treated as a separate indexable SEO property.

## Sitelink Targets

Primary organic sitelink targets are:

- `/get-matched`
- `/services`
- `/directory`
- `/emergency`
- `/pricing`
- `/pros`
- `/areas`

## SEO Safety Rules

- Do not create fake reviews, ratings, addresses, pricing, licensing claims, or availability claims.
- Keep content people-first and Erie-specific.
- Avoid doorway pages and thin swapped-keyword copy.
- Keep canonical URLs, internal links, sitemap entries, and page titles aligned.
- Verify provider data before publishing claims about credentials, service areas, hours, pricing, or reviews.
