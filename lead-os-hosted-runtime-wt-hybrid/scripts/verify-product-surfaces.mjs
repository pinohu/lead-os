// scripts/verify-product-surfaces.mjs
// Ensures filesystem routes match docs/PRODUCT-SURFACES.md and hybrid README "Key URLs".
import { existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const app = join(root, "src", "app")
const api = join(root, "src", "app", "api")

/** @type {{ label: string; path: string }[]} */
const pages = [
  { label: "home", path: "page.tsx" },
  { label: "/pricing", path: "pricing/page.tsx" },
  { label: "/onboard", path: "onboard/page.tsx" },
  { label: "/setup", path: "setup/page.tsx" },
  { label: "/preferences", path: "preferences/page.tsx" },
  { label: "/manage-data", path: "manage-data/page.tsx" },
  { label: "/demo", path: "demo/page.tsx" },
  { label: "/calculator", path: "calculator/page.tsx" },
  { label: "/contact", path: "contact/page.tsx" },
  { label: "/help", path: "help/page.tsx" },
  { label: "/changelog", path: "changelog/page.tsx" },
  { label: "/roadmap", path: "roadmap/page.tsx" },
  { label: "/industries", path: "industries/page.tsx" },
  { label: "/industries/[slug]", path: "industries/[slug]/page.tsx" },
  { label: "/for/[persona]", path: "for/[persona]/page.tsx" },
  { label: "/offers", path: "offers/page.tsx" },
  { label: "/offers/[slug]", path: "offers/[slug]/page.tsx" },
  { label: "/lp/[slug]", path: "lp/[slug]/page.tsx" },
  { label: "/marketplace", path: "marketplace/page.tsx" },
  { label: "/directory", path: "directory/page.tsx" },
  { label: "/directory/[vertical]", path: "directory/[vertical]/page.tsx" },
  { label: "/funnel/[family]", path: "funnel/[family]/page.tsx" },
  { label: "/embed/[niche]", path: "embed/[niche]/page.tsx" },
  { label: "/p/[tenantSlug]/[pageSlug]", path: "p/[tenantSlug]/[pageSlug]/page.tsx" },
  { label: "/assess/[slug]", path: "assess/[slug]/page.tsx" },
  { label: "/resources/[slug]", path: "resources/[slug]/page.tsx" },
  { label: "/sites/[deploymentId]", path: "sites/[deploymentId]/page.tsx" },
  { label: "/privacy/manage", path: "privacy/manage/page.tsx" },
  { label: "/auth/sign-in", path: "auth/sign-in/page.tsx" },
  { label: "/auth/check-email", path: "auth/check-email/page.tsx" },
  { label: "/docs", path: "docs/page.tsx" },
  { label: "/docs/api", path: "docs/api/page.tsx" },
  { label: "/docs/sla", path: "docs/sla/page.tsx" },
  { label: "/dashboard", path: "dashboard/page.tsx" },
  { label: "/dashboard/control-plane", path: "dashboard/control-plane/page.tsx" },
  { label: "/dashboard/gtm", path: "dashboard/gtm/page.tsx" },
]

/** @type {{ label: string; path: string }[]} */
const apiRoutes = [
  { label: "GET /api/health", path: "health/route.ts" },
  { label: "GET /api/health/deep", path: "health/deep/route.ts" },
  { label: "/api/system", path: "system/route.ts" },
  { label: "/api/queue", path: "queue/route.ts" },
  { label: "/api/operator/control-plane", path: "operator/control-plane/route.ts" },
  { label: "/api/operator/actions", path: "operator/actions/route.ts" },
  { label: "/api/intake", path: "intake/route.ts" },
  { label: "/api/onboarding", path: "onboarding/route.ts" },
  { label: "/api/docs/openapi.json", path: "docs/openapi.json/route.ts" },
  { label: "/api/gmb/ingest", path: "gmb/ingest/route.ts" },
  { label: "/api/gmb/ingest/[slug]", path: "gmb/ingest/[slug]/route.ts" },
  { label: "/api/gmb/ingest/[slug]/quality", path: "gmb/ingest/[slug]/quality/route.ts" },
  { label: "/api/gmb/ingest/[slug]/enrich", path: "gmb/ingest/[slug]/enrich/route.ts" },
  { label: "/api/gbp-sync", path: "gbp-sync/route.ts" },
  { label: "/api/gbp-sync/due", path: "gbp-sync/due/route.ts" },
  { label: "/api/operator/gtm", path: "operator/gtm/route.ts" },
  // Hybrid README architecture block (must stay in sync)
  { label: "/api/widgets/boot", path: "widgets/boot/route.ts" },
  { label: "/api/decision", path: "decision/route.ts" },
  { label: "/api/discovery", path: "discovery/route.ts" },
  { label: "/api/prospects", path: "prospects/route.ts" },
  { label: "/api/experiments", path: "experiments/route.ts" },
  { label: "/api/competitors", path: "competitors/route.ts" },
]

let failed = false

for (const { label, path } of pages) {
  const full = join(app, path)
  if (!existsSync(full)) {
    console.error(`[verify-product-surfaces] MISSING page ${label} -> ${path}`)
    failed = true
  }
}

for (const { label, path } of apiRoutes) {
  const full = join(api, path)
  if (!existsSync(full)) {
    console.error(`[verify-product-surfaces] MISSING API ${label} -> ${path}`)
    failed = true
  }
}

if (failed) {
  console.error("[verify-product-surfaces] Fix missing files or update docs/PRODUCT-SURFACES.md / README.")
  process.exit(1)
}

console.log(
  `[verify-product-surfaces] OK — ${pages.length} App Router pages + ${apiRoutes.length} API entrypoints present.`,
)
